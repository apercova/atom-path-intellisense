'use strict';
const logger = require('../util/logger'),
  BasePathProvider = require('./base-path.provider'),
  DefaultFormatter = require('../formatters/default.formatter');

/**
 *
 * @class
 * @Classdesc Path provider for Less (http://lesscss.org).
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
class LessPathProvider extends BasePathProvider {
  /**
   * @return {LessPathProvider} LessPathProvider instance.
   */
  constructor() {
    super();
    this.id = 'LessPathProvider';
    this.priority = 9991;
    this.scopeSelector = '.source.css.less .string';
    this.formatter = new DefaultFormatter({ trimext: true });
    this.fileExtFilter = ['.css', '.less'];
    this._logger = logger.getLogger(this.id);
    this._testPathRegex = /@import\s+?["'](.*?)["']/;
  }

  /**
   * canResolve - Determines whether this provider can resolve suggestions based on context.
   *
   * @param  {object} req Request oprions.
   * @return {boolean}    true if this provider can resolve suggestions. false otherwise.
   */
  canResolve(req) {
    return this.$getCurrentLine(req, true).match(this._contextPatternRegex) ? true : false;
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
    return this.$resolveSuggestions(req, searchPath);
  }

  /**
   * $getTestPath - Resolve testPath from given text line.
   *
   * @param  {object} req  Request options.
   * @param  {string} line Text line.
   * @return {string}      Test path.
   */
  $getTestPath(req, line) {
    let match = line.match(this._testPathRegex);
    let testPath = match ? match[1] : '';
    this._logger.debug(`Test path resolved as: ${testPath}`);
    return testPath;
  }
}
LessPathProvider.id = 'LessPathProvider';
module.exports = LessPathProvider;
