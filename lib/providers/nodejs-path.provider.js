'use strict';
const path = require('path'),
  fs = require('fs'),
  mod = require('module'),
  child_process = require('child_process'),
  logger = require('../util/logger'),
  paths = require('../util/paths-utils'),
  BasePathProvider = require('./base-path.provider'),
  BaseFormatter = require('../formatters/base.formatter'),
  DefaultFormatter = require('../formatters/default.formatter'),
  SuggestionsDTO = require('../dto/suggestions.dto'),
  SearchPathDTO = require('../dto/search-path.dto');

/**
 *
 * @class
 * @Classdesc Path provider for Node.js modules.
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
class NodeJSPathProvider extends BasePathProvider {
  /**
   * @param  {BaseFormatter}      formatter Formatter instance.
   * @return {NodeJSPathProvider}           NodeJSPathProvider instance.
   */
  constructor(formatter) {
    super();
    this.id = 'NodeJSPathProvider';
    this.priority = 9991;
    this.scopeSelector = '.source.js .string.quoted';
    this.formatter = formatter instanceof BaseFormatter ? formatter : new DefaultFormatter();
    this.fileExtFilter = ['.js'];
    this._logger = logger.getLogger(this.id);
    this._global_node_modules = '';
    this._requirePatternRegex = /require\(['"](.*?)['"]\)/;
    this._importPatternRegex = /import.*?from.*?['"](.*?)['"]/;
    this._prefixRegex = /([^/]+?)$/;
    this._biModRegex = /^[^~./].*$/;
    this._biModPrefixRegex = /([^'"]+?)$/;
  }

  /**
   * canResolve - Determines whether this provider can resolve suggestions based on context.
   *
   * @param  {object} req Request oprions.
   * @return {boolean}    true if this provider can resolve suggestions. false otherwise.
   */
  canResolve(req) {
    const line = this.$getCurrentLine(req, true);
    if (line.match(this._requirePatternRegex)) {
      return true;
    }
    let match = line.match(this._importPatternRegex);
    if (match && match[1]) {
      return match[1].match(this._biModRegex) ? true : false;
    }
    return false;
  }

  /**
   * resolve - Resolve suggestions.
   *
   * @param  {object} req Request options.
   * @return {Promise}    Promise for resolving path suggestions.
   */
  resolve(req) {
    const self = this;
    return new Promise((resolve, reject) => {
      self
        .$resolveSuggestions(req, self.$resolveSearchPathSync(req))
        .then(suggestions => {
          if (self._getTestPath(req).match(self._biModRegex)) {
            const biModSuggestions = self._resolveBuiltInModuleSuggestions(req);
            suggestions = suggestions.concat(biModSuggestions);
          }
          resolve(suggestions);
        })
        .catch(e => {
          self._logger.warn(e);
          reject(e);
        });
    });
  }

  /**
   * activate - Provides a mechanism to initialize provider dependencies.
   *
   * @return {Promise} A promise for provider activation.
   */
  activate() {
    let self = this;
    return new Promise((resolve, reject) => {
      try {
        child_process.exec('npm root -g', (err, stdout, stderr) => {
          if (err) {
            self._logger.warn(err);
          } else {
            self._logger.debug(`npm root -g stdout: ${stdout}`);
            if (stderr) {
              self._logger.warn('npm root -g stderr:');
              self._logger.warn(stderr);
            }
            self._global_node_modules = path.format(path.parse(`${stdout}`.trim()));
            self._logger.debug(`Global node_modules path: ${self._global_node_modules}`);
            resolve(this);
          }
        });
      } catch (e) {
        reject({
          error: e,
          provider: this
        });
      }
    });
  }

  /**
   * resolveSearchPathSync - Resolves search path in a sync way.
   *
   * @param  {object} req    Request options.
   * @return {SearchPathDTO} Search path.
   */
  $resolveSearchPathSync(req) {
    let testPath = this._getTestPath(req);
    let basePath = this._resolveBasePath(req, testPath);
    let fullPath = this.$normalizeRelativePath(basePath, testPath);
    this._logger.debug(`trying path: ${testPath}`);
    this._logger.debug(`base path resolved as: ${basePath}`);
    this._logger.debug(`full path resolved as: ${fullPath}`);
    let searchPath = '';
    /* Validating existence as file or directory */
    if (paths.pathDoesExistSync(fullPath)) {
      this._logger.debug(`${fullPath} does exist`);
      /*If path is a dir, return it, otherwise, return parent dir*/
      searchPath = paths.pathIsDirectory(fullPath) ? fullPath : path.parse(fullPath).dir;
    } else {
      /* testPath neither exists as file nor directory
       * Validating existence of parent directory */
      this._logger.debug(`${fullPath} does not exist`);
      if (testPath.endsWith('/')) {
        /* No path exists at all, return fullPath*/
        this._logger.debug('No path exists at all');
        searchPath = fullPath;
      } else {
        /* Prevents searching on parent directory if test path is a directory
         * If path parent dir exists, resolve it., otherwise resolve full path */
        searchPath = path.parse(fullPath).dir;
        searchPath = paths.pathDoesExistSync(searchPath) ? searchPath : fullPath;
      }
    }
    return new SearchPathDTO(basePath, searchPath, testPath);
  }

  /**
   * $getPrefix - Return replacement prefix for suggestions.
   *
   * @param  {object} req Request options.
   * @return {string}     Replacement prefix.
   */
  $getPrefix(req) {
    const match = this._getTestPath(req).match(this._prefixRegex);
    return match ? match[0] : '';
  }

  /**
   * $getPrefix - Return replacement prefix for Node.js Built-in modules suggestions.
   *
   * @param  {object} req Request options.
   * @return {string}     Replacement prefix.
   */
  _getBiModPrefix(req) {
    return this._getTestPath(req);
  }

  /**
   * _getTestPath - Returns possible path for provider based on context.
   *
   * @param  {object} req Request options.
   * @return {string}     Possible path for provider based on context.
   */
  _getTestPath(req) {
    const line = this.$getCurrentLine(req);
    let testPath = '';
    let match = line.match(this._requirePatternRegex);
    if (match) {
      testPath = match[1];
    }
    match = line.match(this._importPatternRegex);
    if (match) {
      testPath = match[1];
    }
    return testPath;
  }

  /**
   * _resolveBasePath - Resolves basePath based on testPath.
   *
   * @param  {object} req      Request options.
   * @param  {string} testPath Test path.
   * @return {string}          Base path.
   */
  _resolveBasePath(req, testPath) {
    return testPath.startsWith('~/')
      ? this.$getHomedir()
      : testPath.startsWith('.')
        ? this.$getCurrentFilePath(req)
        : this._getProjectNodeModulesDir(req);
  }

  /**
   * _getProjectNodeModulesDir - Returns Node.js node_modules dir for current project dir.
   *
   * @param  {object} req Request options.
   * @return {string}     Node.js node_modules dir for current project dir.
   */
  _getProjectNodeModulesDir(req) {
    return path.join(this.$getCurrentProjectPath(req, true, true), 'node_modules');
  }

  /**
   * _resolveBuiltInModuleSuggestions - Resolves suggestions for Node.js Built-in modules.
   *
   * @param  {object}         req Request options.
   * @return {SuggestionsDTO}     Suggestions.
   */
  _resolveBuiltInModuleSuggestions(req) {
    let result = new SuggestionsDTO(
      this._getBiModPrefix(req),
      [],
      this.$getCurrentFilePath(req),
      this._getTestPath(req)
    );
    mod.builtinModules.forEach(mod => {
      result.suggestions.push({ type: 'bimodule', entry: mod });
    });
    return this.formatter.format(result);
  }
}
NodeJSPathProvider.id = 'NodeJSPathProvider';
module.exports = NodeJSPathProvider;
