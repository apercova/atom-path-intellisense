'use strict';
const path = require('path'),
  fs = require('fs'),
  settings = require('../config/settings'),
  consts = require('../config/consts'),
  logger = require('../util/logger'),
  BasePathProvider = require('./base-path.provider'),
  BaseFormatter = require('../formatters/base.formatter'),
  DefaultFormatter = require('../formatters/default.formatter'),
  SearchPathDTO = require('../dto/search-path.dto');
/**
 *
 * @class
 * @Classdesc Path provider for paths relative to current file path.
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
class CurrentFileRelativePathProvider extends BasePathProvider {
  /**
   * @param  {BaseFormatter}                   formatter Formatter instance.
   * @return {CurrentFileRelativePathProvider}           CurrentFileRelativePathProvider instance.
   */
  constructor(formatter) {
    super();
    this.id = 'CurrentFileRelativePathProvider';
    this.priority = 9997;
    this.scopeSelector = settings[`${consts.CF_ALLOWED_SCOPES}`].default;
    this.formatter = formatter instanceof BaseFormatter ? formatter : new DefaultFormatter();
    this._logger = logger.getLogger(this.id);
    this._relPathRegex = /(\/|~\/|\.\/|\.\.\/)/;
    this._prefixRegex = /[^/]+$/;
  }

  /**
   * canResolve - Determines whether this provider can resolve suggestions based on context.
   *
   * @param  {object} req Request oprions.
   * @return {boolean}    true if this provider can resolve suggestions. false otherwise.
   */
  canResolve(req) {
    return this.$getCurrentLineUpCursor(req, true).match(this._relPathRegex) ? true : false;
  }

  /**
   * resolve - Resolve suggestions.
   *
   * @param  {object} req Request options.
   * @return {Promise}    Promise for resolving path suggestions.
   */
  resolve(req) {
    return this.$resolveSuggestions(
      req,
      this._resolveValidPathSync(this, req, this.$getCurrentLineUpCursor(req, true))
    );
  }

  /**
   * $getPrefix - Return replacement prefix for suggestions.
   *
   * @param  {object}        req    Request options.
   * @param  {SearchPathDTO} search Search options
   * @return {string}               Replacement prefix.
   */
  $getPrefix(req, search) {
    let prefix = '';
    if (search instanceof SearchPathDTO) {
      const match = search.testPath.match(this._prefixRegex);
      prefix = match ? match[0] : '';
    }
    return prefix;
  }

  /**
   * _pathDoesExistSync - Determines whether a path exists or not.
   *
   * @param  {string}  path Path to test for existence.
   * @return {boolean}      true if given path does exist. false otherwise.
   */
  _pathDoesExistSync(path) {
    try {
      fs.accessSync(path || '', fs.constants.F_OK);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * _getPathStatsSync - Retrieves path stats.
   *
   * @param  {string}   path Path to get stats from.
   * @return {fs.Stats}      Path stats.
   */
  _getPathStatsSync(path) {
    return fs.statSync(path);
  }

  /**
   * _resolveValidPathSync - Recursively resolves search path from a test string.
   *
   * @param  {BasePathProvider} $self      Self reference.
   * @param  {object}           req        options.
   * @param  {string}           testPath   to test for path recognition.
   * @param  {string}           searchPath search path.
   * @param  {string}           basePath   base path.
   * @param  {number}           idx        count index.
   * @return {SearchPathDTO}               Found search path.
   */
  _resolveValidPathSync($self, req, testPath, searchPath, basePath, idx) {
    let foundPath = null;
    if (searchPath) {
      foundPath = new SearchPathDTO(basePath, searchPath, testPath);
      return foundPath;
    }
    if (testPath) {
      idx = !isNaN(idx) ? idx : 0;
      idx++;
      $self._logger.debug(`testPath: ${testPath}`);
      const matches = testPath.match($self._relPathRegex);
      if (matches && matches[0]) {
        testPath = testPath.substring(matches.index);
        $self._logger.debug(`trying ${testPath}`);

        basePath = testPath.startsWith('~/')
          ? $self.$getHomedir()
          : testPath.startsWith('/')
            ? $self.$getCurrentProjectPath(req, true)
            : $self.$getCurrentFilePath(req, true);
        $self._logger.debug(`basepath: ${basePath}`);

        let fullTestPath = testPath.startsWith('~/')
          ? path.normalize(path.join(basePath, testPath.replace(/^~\//, '')))
          : path.normalize(path.join(basePath, testPath));

        $self._logger.debug(`full path resolved as: ${fullTestPath}`);
        /* Validating existence as file or directory */
        if ($self._pathDoesExistSync(fullTestPath)) {
          $self._logger.debug(`${fullTestPath} does exist as file or dir`);
          /* Path does exist, validate if file or dir */
          let stats = $self._getPathStatsSync(fullTestPath);
          if (stats.isDirectory()) {
            $self._logger.debug(`${fullTestPath} is a dir`);
            if (testPath.endsWith('/')) {
              foundPath = $self._resolveValidPathSync($self, req, testPath, fullTestPath, basePath, idx);
            } else {
              /*
               * Fix to allow searching existing directory while not specifying
               * forward slash in order to avoid change back directory when use
               * back directory name (..)
               */
              fullTestPath = path.parse(fullTestPath).dir;
              foundPath = $self._resolveValidPathSync($self, req, testPath, fullTestPath, basePath, idx);
            }
          } else {
            $self._logger.debug(`${fullTestPath} is a file`);
            fullTestPath = path.parse(fullTestPath).dir;
            foundPath = $self._resolveValidPathSync($self, req, testPath, fullTestPath, basePath, idx);
          }
        } else {
          /* testPath neither exists as file nor directory
           * Validating existence of parent directory */
          $self._logger.debug(`${fullTestPath} does not exist as file nor dir`);
          if (testPath.endsWith('/')) {
            /* No path exists at all, trying next match */
            testPath = testPath.substring(matches[0].length);
            foundPath = $self._resolveValidPathSync($self, req, testPath, '', basePath, idx);
          } else {
            fullTestPath = path.parse(fullTestPath).dir;
            if ($self._pathDoesExistSync(fullTestPath)) {
              $self._logger.debug(`${fullTestPath} does exist as parent dir`);
              /* Path exists as parent dir, return match */
              foundPath = $self._resolveValidPathSync($self, req, testPath, fullTestPath, basePath, idx);
            } else {
              $self._logger.debug(`${fullTestPath} does not exist as parent dir`);
              /* Path does not exist as parent dir, trying next match */
              testPath = testPath.substring(matches[0].length);
              foundPath = $self._resolveValidPathSync($self, req, testPath, '', basePath, idx);
            }
          }
        }
      }
    }

    return foundPath;
  }
}
CurrentFileRelativePathProvider.id = 'CurrentFileRelativePathProvider';
module.exports = CurrentFileRelativePathProvider;
