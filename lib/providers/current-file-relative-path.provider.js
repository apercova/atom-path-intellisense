const path = require('path');
const fs = require('fs');
const mod = require('module');
const winston = require('winston');
const logger = require('../util/logger');
const BasePathProvider = require('./base-path.provider');
const BaseFormatter = require('../formatters/base.formatter');
const SuggestionsDTO = require('../dto/suggestions.dto');
const SearchPathDTO = require('../dto/search-path.dto');

class CurrentFileRelativePathProvider extends BasePathProvider {

  constructor(formatter) {
		super();
		this.id = 'CurrentFileRelativePathProvider';
		this.priority = 9997;
    this.scopeSelector = '.source .string.quoted, .text.xml .string';
    this.formatter = formatter instanceof BaseFormatter
										? formatter : new DefaultFormatter();
    this._relPathRegex = /(\/|\.\/|\.\.\/)/;
    this._logger = logger.getLogger(this.id);
	}

  /**
   * canResolve - Determines wether this provider can resolve suggestions
   *
   * @param  {object} req Request options
   * @return {object}     {@code true} if this provider can resolve suggestions. {@code false} otherwise
   */
  canResolve(req) {
		return this.$getCurrentLineUpCursor(req, true).match(this._relPathRegex) ? true : false;
	}

  /**
   * resolve - Resolve suggestions
   *
   * @param  {object} req Request options
   * @return {object}     Autocomplete suggestions
   */
  resolveBak(req) {
    const search = this._resolveValidPathSync(
      this, req,
      this.$getCurrentLineUpCursor(req, true)
    );
    if (!search instanceof SearchPathDTO) {
      return Promise.resolve(this.formatter.format(result));
    } else {
      this._logger.debug("found path!");
      this._logger.debug(JSON.stringify(search));
      return this.$resolveSuggestions(req, search);
    }

  }
  resolve(req) {
    const self = this;
    const promize = new Promise((resolve, reject) => {
      let result = new SuggestionsDTO();

      const search = self._resolveValidPathSync(
        self, req,
        self.$getCurrentLineUpCursor(req, true)
      );
      self._logger.debug(JSON.stringify(search));
      if (!search instanceof SearchPathDTO) {
        resolve(self.formatter.format(result));
      } else {
        self._logger.debug("found path!");
        self._logger.debug(JSON.stringify(search));
        if (search && search.searchPath) {
          result = new SuggestionsDTO(self.$getPrefix(req, search), [], search.searchPath);
          try {
		  fs.readdir(search.searchPath,
            function(e, entries){
              if (e) { self._logger.warn(e); }
  						result.suggestions.push({type: 'dir', entry: '..'});
  						entries.forEach(function (entry) {
  							try {
                  let entryStats = fs.statSync(path.resolve(search.searchPath, entry));
    							if (entryStats) {
    								if(entryStats.isFile()){
    									result.suggestions.push({type: 'file', entry: entry});
    								}
    								if(entryStats.isDirectory()){
    									result.suggestions.push({type: 'dir', entry: entry});
    								}
    							}
                } catch(e) {
                  self._logger.warn(e);
                }
  						});
  						resolve(self.formatter.format(result));
  					});
  				} catch (err) {
            self._logger.warn(err);
            resolve(self.formatter.format(result));
  				}
  			} else {
  				resolve(self.formatter.format(result));
  			}
      }

    });
    return promize;
  }

  /**
   * _resolveValidPathSync - Recursively resolves search path from test string
   *
   * @param  {BasePathProvider} $self    Self reference
   * @param  {object} req                Request options
   * @param  {string} testPath           String to test for path recognition
   * @param  {string} searchPath         Found search path
   * @param  {number} idx                Iteration count index
   * @return {SearchPathDTO}             Found search path props
   */
  _resolveValidPathSync($self, req, testPath, searchPath, idx) {
    let basePath = $self.$getCurrentFilePath(req, true);
    $self._logger.debug(`basepath: ${basePath}`);
    idx = !isNaN(idx) ? idx : 0;
    idx ++;
    if (searchPath) {
      return new SearchPathDTO(basePath, searchPath, testPath);
    } else if (!testPath) {
      return false;
    }
    else {
      const matches = testPath.match($self._relPathRegex);
      if (!matches || !matches[0]) {
        return $self._resolveValidPathSync($self, req, undefined, undefined, idx);
      } else {
        testPath = testPath.substring(matches.index);
        $self._logger.debug(`trying ${testPath}`);
        if(testPath.startsWith('/')) {
          /* Adjust base path to project relative dir */
          basePath = $self.$getCurrentProjectPath(req, true);
          $self._logger.debug(`basepath: ${basePath}`);
        }
        let fullTestPath = path.normalize(`${basePath}/${testPath}`);
        $self._logger.debug(fullTestPath);
        /* Validating existence as file or directory */
        try {
          fs.accessSync(fullTestPath, fs.constants.F_OK);
          $self._logger.debug(`${fullTestPath} does exist as file or dir`);
          /* Path does exist, validate if file or dir */
          let stats = fs.statSync(fullTestPath);
          if (!stats.isDirectory()) {
            $self._logger.debug(`${fullTestPath} is a file`);
            fullTestPath = path.parse(fullTestPath).dir;
            return $self._resolveValidPathSync($self, req, testPath, fullTestPath, idx);
          } else {
            $self._logger.debug(`${fullTestPath} is a dir`);
            if (testPath.endsWith('/')) {
              return $self._resolveValidPathSync($self, req, testPath, fullTestPath, idx);
            } else {
              /*
               * Fix to allow searching existing directory while not specifying
               * forward slash in order to avoid change back directory when use
               * back directory name (..)
               */
              fullTestPath = path.parse(fullTestPath).dir;
              return $self._resolveValidPathSync($self, req, testPath, fullTestPath, idx);
            }
          }
        } catch(e)
        {
          $self._logger.warn(e);
          $self._logger.debug(`${fullTestPath} does not exist as file nor dir`);
          /* testPath neither exists as file nor directory
           * Validating existence of parent directory */
          if (!testPath.endsWith('/')) {
              /* Prevents searching on parent directory if test path is a directory */
              fullTestPath = path.parse(fullTestPath).dir;
              try {
                fs.accessSync(fullTestPath, fs.constants.F_OK);
                $self._logger.debug(`${fullTestPath} does exist as parent dir`);
                /* Path exists as parent dir, return match */
                return $self._resolveValidPathSync($self, req, testPath, fullTestPath, idx);
              } catch (e) {
                $self._logger.warn(e);
                $self._logger.debug(`${fullTestPath} does not exist as parent dir`);
                /* Path does not exist as parent dir, trying next match */
                testPath = testPath.substring(matches[0].length);
                return $self._resolveValidPathSync($self, req, testPath, undefined, idx);
              }
          } else {
            /* No path exists at all, trying next match */
            testPath = testPath.substring(matches[0].length);
            return $self._resolveValidPathSync($self, req, testPath, undefined, idx);
          }
        }
      }
    }
  }

  /**
   * $getPrefix - Return replacement prefix
   *
   * @param  {object} req Request options
   * @return {string}     Replacement prefix
   */
  $getPrefix(req, search){
    const regex = /[^\/]+$/;
    const match = search.testPath.match(regex);
    return match ? match[0] : '';
  }

  /**
   * dispose - Provides a mechanism to release resources before disposing
   *
   * @return {void}
   */
  dispose() {
    this._logger.debug(`Disposing path provider: ${this.id}`);
		winston.loggers.close(this.id);
		this.formatter = null;
  }
}
CurrentFileRelativePathProvider.id = 'CurrentFileRelativePathProvider';
module.exports = CurrentFileRelativePathProvider;
