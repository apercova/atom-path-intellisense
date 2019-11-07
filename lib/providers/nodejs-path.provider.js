'use strict';
const path = require('path'),
  mod = require('module'),
  child_process = require('child_process'),
  logger = require('../util/logger'),
  stringUtils = require('../util/string-utils'),
  BasePathProvider = require('./base-path.provider'),
  NodeJSFormatter = require('../formatters/nodejs.formatter'),
  SuggestionsDTO = require('../dto/suggestions.dto');

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
   * @return {NodeJSPathProvider}           NodeJSPathProvider instance.
   */
  constructor() {
    super();
    this.id = 'NodeJSPathProvider';
    this.priority = 9980;
    this.scopeSelector = ['.source.js .string.quoted', '.source.ts .string.quoted'].join(',');
    this.formatter = new NodeJSFormatter();
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
    const line = this.$getCurrentLine(req);
    let testPath = this.$getTestPath(req, line);
    let basePath = this.$resolveRelativeBasePath(req, testPath);
    let searchPath = this.$resolveRelativeSearchPathSync(req, basePath, testPath);
    //return this.$resolveSuggestions(req, searchPath);
    const self = this;
    return new Promise((resolve, reject) => {
      self
        .$resolveSuggestions(req, searchPath)
        .then(suggestions => {
          if (testPath.match(self._biModRegex)) {
            const biModSuggestions = self._resolveBuiltInModuleSuggestions(req, testPath);
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
   * $getPrefix - Return replacement prefix for suggestions.
   *
   * @param  {object}        req    Request options.
   * @param  {SearchPathDTO} search Search path info.
   * @return {string}               Replacement prefix.
   */
  $getPrefix(req, search) {
    const match = search.testPath.match(this._prefixRegex);
    return match ? match[0] : '';
  }

  /**
   * $getTestPath - Resolve testPath from given text line.
   *
   * @param  {object} req  Request options.
   * @param  {string} line Text line.
   * @return {string}      Test path.
   */
  $getTestPath(req, line) {
    let testPath = this._getRequireTestPath(req, line);
    if (!testPath) {
      testPath = this._getImportTestPath(req, line);
    }
    testPath = stringUtils.unescapeStringQuote(testPath);
    this._logger.debug(`testPath resolved as : ${testPath}`);
    return testPath;

    /*let testPath = '';
    let match = line.match(this._requirePatternRegex);
    if (match) {
      testPath = match[1];
    }
    match = line.match(this._importPatternRegex);
    if (match) {
      testPath = match[1];
    }
    return testPath;*/
  }

  _getImportTestPath(req, line) {
    let match = line.match(this._importPatternRegex);
    return match ? match[1] || '' : '';
  }

  _getRequireTestPath(req, line) {
    const cindex = req.bufferPosition.column;
    const requirePatternRegex = /require\(['"](.*?)['"]\)/g;
    let beginMatch,
      endMatch,
      beginPath,
      endPath,
      matches = [],
      pos = 0,
      nextMatch = true,
      sline = line.substr(pos),
      match = new RegExp(requirePatternRegex).exec(sline);
    this._logger.debug(`Cursor position: [${req.bufferPosition.row},${req.bufferPosition.column}]`);
    this._logger.debug('=====================================================');
    nextMatch = nextMatch && match;
    while (nextMatch) {
      this._logger.debug(match.input);
      this._logger.debug(match);
      beginMatch = pos + match.index;
      beginPath = pos + match.index + match[0].indexOf(match[1]);
      endPath = pos + match.index + match[0].indexOf(match[1]) + match[1].length;
      endMatch = beginMatch + match[0].length;
      let _match = {
        input: line,
        match: match[0],
        path: match[1],
        beginMatch: beginMatch,
        endMatch: endMatch,
        beginPath: beginPath,
        endPath: endPath,
        matchCursor: cindex >= beginPath && cindex <= endPath
      };
      this._logger.debug('match: ' + _match.match);
      this._logger.debug('path: ' + _match.path);
      this._logger.debug('beginMatch: ' + _match.beginMatch);
      this._logger.debug('beginPath: ' + _match.beginPath);
      this._logger.debug('endPath: ' + _match.endPath);
      this._logger.debug('endMatch: ' + _match.endMatch);
      this._logger.debug('matchCursor: ' + _match.matchCursor);

      if (_match.matchCursor) {
        _match.testPath = _match.path.substr(0, _match.path.length - (_match.endPath - cindex));
        matches.push(_match);
        nextMatch = false;
      } else {
        pos = endMatch;
        sline = line.substr(pos);
        match = new RegExp(requirePatternRegex).exec(sline);
        nextMatch = match ? true : false;
      }
      this._logger.debug('=====================================================');
    }
    return matches[0] ? matches[0].testPath : '';
  }

  /**
   * $resolveRelativeBasePath - Resolves relative basePath based on testPath.
   *
   * @param  {object} req      Request options.
   * @param  {string} testPath Test path.
   * @return {string}          Base path.
   */
  $resolveRelativeBasePath(req, testPath) {
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
   * @param  {object}         req      Request options.
   * @param  {object}         testPath Test path.
   * @return {SuggestionsDTO}          Suggestions.
   */
  _resolveBuiltInModuleSuggestions(req, testPath) {
    let result = new SuggestionsDTO(testPath, [], this.$getCurrentFilePath(req), testPath);
    mod.builtinModules.forEach(mod => {
      result.suggestions.push({ type: 'bimodule', entry: mod });
    });
    return this.formatter.format(result);
  }
}
NodeJSPathProvider.id = 'NodeJSPathProvider';
module.exports = NodeJSPathProvider;
