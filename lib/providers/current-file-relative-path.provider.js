'use strict';
const path = require('path'),
  settings = require('../config/settings'),
  consts = require('../config/consts'),
  logger = require('../util/logger'),
  paths = require('../util/paths-utils'),
  BasePathProvider = require('./base-path.provider'),
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
   * @return {CurrentFileRelativePathProvider} CurrentFileRelativePathProvider instance.
   */
  constructor() {
    super();
    this.id = 'CurrentFileRelativePathProvider';
    this.priority = 9998;
    this.scopeSelector = settings[`${consts.CF_ALLOWED_SCOPES}`].default;
    this.formatter = new DefaultFormatter();
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
   * _resolveValidPathSync - Recursively resolves search path from a test string.
   *
   * @param  {BasePathProvider} $self      Self reference.
   * @param  {object}           req        options.
   * @param  {string}           testPath   to test for path recognition.
   * @param  {string}           basePath   base path.
   * @param  {string}           searchPath search path.
   * @param  {number}           idx        count index.
   * @return {SearchPathDTO}               Found search path.
   */
  _resolveValidPathSync($self, req, testPath, basePath, searchPath, idx) {
    if (searchPath) {
      return new SearchPathDTO(basePath, searchPath, testPath);
    }
    let vPath = null;
    if (testPath) {
      idx = !isNaN(idx) ? idx : 0;
      idx++;
      $self._logger.debug(`testPath: ${testPath}`);
      const matches = testPath.match($self._relPathRegex);
      if (matches && matches[0]) {
        testPath = testPath.substring(matches.index);
        basePath = $self.$resolveRelativeBasePath(req, testPath);
        let fullPath = $self.$normalizeRelativePath(basePath, testPath);
        $self._logger.debug(`trying path: ${testPath}`);
        $self._logger.debug(`base path resolved as: ${basePath}`);
        $self._logger.debug(`full path resolved as: ${fullPath}`);
        /* Validating existence as file or directory */
        if (paths.pathDoesExistSync(fullPath)) {
          $self._logger.debug(`${fullPath} does exist`);
          /* Path does exist, validate if file or dir */
          if (paths.pathIsDirectory(fullPath)) {
            /*
             * Fix to allow searching existing directory while not specifying
             * forward slash in order to avoid change back directory when use
             * back directory name (..)
             */
            vPath = testPath.endsWith('/')
              ? $self._resolveValidPathSync($self, req, testPath, basePath, fullPath, idx)
              : $self._resolveValidPathSync($self, req, testPath, basePath, path.parse(fullPath).dir, idx);
          } else {
            fullPath = path.parse(fullPath).dir;
            vPath = $self._resolveValidPathSync($self, req, testPath, basePath, fullPath, idx);
          }
        } else {
          /* testPath neither exists as file nor directory
           * Validating existence of parent directory */
          $self._logger.debug(`${fullPath} does not exist`);
          fullPath = path.parse(fullPath).dir;
          if (testPath.endsWith('/') || !testPath.endsWith('/') && !paths.pathDoesExistSync(fullPath)) {
            $self._logger.debug(`${fullPath} does not exist as parent dir`);
            /* No path exists at all, trying next match */
            vPath = $self._resolveValidPathSync($self, req, testPath.substring(matches[0].length), basePath, '', idx);
          } else {
            $self._logger.debug(`${fullPath} does exist as parent dir`);
            /* Path exists as parent dir, return match */
            vPath = $self._resolveValidPathSync($self, req, testPath, basePath, fullPath, idx);
          }
        }
      }
    }
    return vPath;
  }
}
CurrentFileRelativePathProvider.id = 'CurrentFileRelativePathProvider';
module.exports = CurrentFileRelativePathProvider;
