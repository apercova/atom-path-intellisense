'use strict';
const path = require('path'),
  fs = require('fs'),
  os = require('os'),
  winston = require('winston'),
  logger = require('../util/logger'),
  stringUtils = require('../util/string-utils'),
  SearchPathDTO = require('../dto/search-path.dto'),
  SuggestionsDTO = require('../dto/suggestions.dto');

/**
 *
 * @class
 * @Classdesc Base path provider.
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
class BasePathProvider {
  /**
   * @return {BasePathProvider}  BasePathProvider instance.
   */
  constructor() {
    this.id = 'BasePathProvider';
    this.priority = 999999999;
    this.scopeSelector = '*';
    this.fileExtFilter = null;
    this._logger = logger.getLogger(this.id);
  }

  /**
   * canResolve - Determines whether this provider can resolve suggestions based on context.
   *
   * @return {boolean}  true if this provider can resolve suggestions. false otherwise.
   */
  canResolve() {
    return false;
  }

  /**
   * resolve - Resolve suggestions.
   *
   * @return {Promise} Promise for resolving path suggestions.
   */
  resolve() {
    return Promise.resolve([]);
  }

  /**
   * activate - Provides a mechanism to initialize provider dependencies.
   *
   * @return {Promise} A promise for provider activation.
   */
  activate() {
    const self = this;
    return new Promise(resolve => {
      self._logger.debug(`Activated provider ${self.id || ''}`);
      resolve(self);
    });
  }

  /**
   * dispose - Provides a mechanism to release provider resources.
   *
   *  @return {Promise}  A promise for provider disposition.
   */
  dispose() {
    return new Promise((resolve, reject) => {
      try {
        winston.loggers.close(this.id);
        this.formatter = null;
        resolve(this);
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
    const filePath = this.$getCurrentFilePath(req);
    this._logger.debug(`full path resolved as: ${filePath}`);
    return new SearchPathDTO(filePath, filePath, '');
  }

  /**
   * resolveSuggestions - Resolve suggestions for a possible path.
   *
   * @param  {object}        req    Request options.
   * @param  {SearchPathDTO} search Search path.
   * @return {SuggestionsDTO}       Suggestions.
   */
  $resolveSuggestions(req, search) {
    const self = this;
    const promize = new Promise(resolve => {
      let result = new SuggestionsDTO();
      if (!(search instanceof SearchPathDTO)) {
        resolve(self.formatter.format(result));
      } else {
        /*Adjust path params*/
        result.prefix = self.$getPrefix(req, search) || result.prefix;
        result.searchPath = search.searchPath || result.searchPath;
        result.testPath = search.testPath || result.testPath;
        try {
          fs.readdir(result.searchPath, (err, entries) => {
            if (err) {
              self._logger.warn(err);
            }
            if (Array.isArray(entries)) {
              result.suggestions.push({
                type: 'dir',
                entry: '..'
              });
              entries.forEach(entry => {
                try {
                  let entryStats = fs.statSync(path.resolve(result.searchPath, entry));
                  if (entryStats) {
                    if (entryStats.isFile()) {
                      result.suggestions.push({
                        type: 'file',
                        entry: entry
                      });
                    }
                    if (entryStats.isDirectory()) {
                      result.suggestions.push({
                        type: 'dir',
                        entry: entry
                      });
                    }
                  }
                } catch (e) {
                  self._logger.debug(`Could not stat entry: ${entry}`);
                  self._logger.debug(e);
                }
              });

              if (Array.isArray(self.fileExtFilter)) {
                self._logger.debug('Filtering files by extension.');
                result.suggestions = result.suggestions.filter(s => {
                  return s.type === 'file' ? self.fileExtFilter.some(ext => ext === path.parse(s.entry).ext) : true;
                });
              }
            }
            resolve(self.formatter.format(result));
          });
        } catch (err) {
          self._logger.warn(err);
          resolve(self.formatter.format(result));
        }
      }
    });
    return promize;
  }

  /**
   * $getPrefix - Return replacement prefix for suggestions.
   *
   * @param  {object} req Request options.
   * @return {string}     Replacement prefix.
   */
  $getPrefix(req) {
    const regex = /[^/]+$/;
    const match = this.$getCurrentLineUpCursor(req).match(regex);
    let prefix = match ? match[0] : '';
    this._logger.debug(`Prefix resolved as: ${prefix}`);
    return prefix;
  }

  /**
   * getCurrentLine - Return current buffer line.
   *
   * @param  {object}  req      Request options.
   * @param  {boolean} unescape Indicates whether unescape buffer line.
   * @return {string}           Current buffer line.
   */
  $getCurrentLine(req, unescape) {
    let line = req ? stringUtils.unescapeStringQuote(req.editor.getLastCursor().getCurrentBufferLine()) : '';
    line = unescape ? stringUtils.unescapeStringQuote(line) : line;
    line = line ? unescape ? stringUtils.unescapeStringQuote(line) : line : line;
    this._logger.debug(`Current line resolved as: ${line}`);
    return line;
  }

  /**
   * getCurrentLineUpCursor - Return current buffer line up to cursor position.
   *
   * @param  {object}  req      Request options.
   * @param  {boolean} unescape Indicates whether unescape buffer line.
   * @return {string}           Current buffer line up to cursor position.
   */
  $getCurrentLineUpCursor(req, unescape) {
    let line = req ? req.editor.getTextInRange([[req.bufferPosition.row, 0], req.bufferPosition]) : '';
    line = line ? unescape ? stringUtils.unescapeStringQuote(line) : line : line;
    this._logger.debug(`Current line up to cursor resolved as: ${line}`);
    return line;
  }

  /**
   * getCurrentFilePath - Return current file path.
   *
   * @param  {object}  req      Request options.
   * @param  {boolean} unescape Indicates whether unescape buffer line.
   * @return {string}           Current file path.
   */
  $getCurrentFilePath(req, unescape) {
    let filePath = req.editor.getPath();
    filePath = filePath ? path.parse(req.editor.getPath()).dir : this.$getHomedir();
    filePath = filePath ? unescape ? stringUtils.unescapeStringQuote(filePath) : filePath : filePath;
    this._logger.debug(`Current file path resolved as: ${filePath}`);
    return filePath;
  }

  /**
   * getCurrentProjectPath - Return current project path.
   * Fallbacks to homedir for not found project path.
   *
   * @param  {object}  req      Request options.
   * @param  {boolean} unescape Indicates whether unescape buffer line.
   * @param  {boolean} home     Indicates whether or not to fallback to homedir.
   * @return {string}           Current project path.
   */
  $getCurrentProjectPath(req, unescape, home) {
    const filePath = req.editor.getPath() || '';
    let projectPath = atom.project
      .getDirectories()
      .filter(testpath => filePath.indexOf(testpath.path) > -1)
      .reduce((found, testpath) => found ? found : testpath.path, '');
    projectPath = projectPath
      ? unescape
        ? stringUtils.unescapeStringQuote(projectPath)
        : projectPath
      : home === true
        ? this.$getHomedir()
        : this.$getRootFsPath();
    this._logger.debug(`Current project path resolved as: ${projectPath}`);
    return projectPath;
  }

  /**
   * getHomedir - Returns user's home dir.
   *
   * @return {string}  user's home dir.
   */
  $getHomedir() {
    let home = os.homedir();
    this._logger.debug(`Homedir path resolved as: ${home}`);
    return home;
  }

  /**
   * getRootFsPath - Returns filesystem root dir.
   *
   * @return {string}  filesystem root dir.
   */
  $getRootFsPath() {
    let fsRoot = path.parse('/').root;
    this._logger.debug(`FileSystem root path resolved as: ${fsRoot}`);
    return fsRoot;
  }

  /**
   * normalizeHomeRelativePath - Normalize a relative path against a base path.
   *
   * @param  {type} basePath description
   * @param  {type} testPath description
   * @return {type}          description
   */
  $normalizeRelativePath(basePath, testPath){
    return testPath.startsWith('~/')
      ? path.normalize(path.join(basePath, testPath.replace(/^~\//, '')))
      : path.normalize(path.join(basePath, testPath));
  }
}
BasePathProvider.id = 'BasePathProvider';
module.exports = BasePathProvider;
