'use strict';
const logger = require('../util/logger'),
  strUtil = require('../util/string-utils'),
  BasePathProvider = require('./base-path.provider'),
  DefaultFormatter = require('../formatters/default.formatter');

/**
 *
 * @class
 * @Classdesc Path provider for Saas (https://sass-lang.com).
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
class SassPathProvider extends BasePathProvider {
  /**
   * @return {SassPathProvider} SassPathProvider instance.
   */
  constructor() {
    super();
    this.id = 'SassPathProvider';
    this.priority = 9991;
    this.scopeSelector = [
      '.source.sass .meta.at-rule.import.sass',
      '.source.sass .meta.selector.css',
      '.source.css.scss .meta.at-rule.import.scss .string'
    ].join(',');
    this.formatter = new DefaultFormatter({ trimext: true });
    this.fileExtFilter = ['.sass', '.scss', '.css'];
    this._logger = logger.getLogger(this.id);
    this._testPathRegex = /@(?:import|use|forward)\s+?(["'].*["'])/;
  }

  /**
   * canResolve - Determines whether this provider can resolve suggestions based on context.
   *
   * @param  {object} req Request oprions.
   * @return {boolean}    true if this provider can resolve suggestions. false otherwise.
   */
  canResolve(req) {
    return this.$getCurrentLine(req, false).match(this._testPathRegex) ? true : false;
  }

  /**
   * resolve - Resolve suggestions.
   *
   * @param  {object} req Request options.
   * @return {Promise}    Promise for resolving path suggestions.
   */
  resolve(req) {
    const line = this.$getCurrentLine(req, false);
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
    const cindex = req.bufferPosition.column;
    let sPaths = line.match(this._testPathRegex)[1] || '';
    let testPath = sPaths
      .split(/\s*,\s*/)
      .map(p => {
        return { input: line, testPath: p, index: line.indexOf(p) };
      })
      .filter(p => p.index >= 0)
      .sort((p1, p2) => p2.index - p1.index)
      .reduce((acum, p) => {
        if (!acum) {
          const start = p.index + 1;
          const end = p.index + p.testPath.length;
          acum = start <= cindex && cindex <= end ? p : acum;
          if (acum) {
            acum = acum.input.substring(acum.index, cindex).replace(/^['"]/, '');
          }
        }
        return acum;
      }, null);
    this._logger.debug(`testPath resolved as : ${testPath}`);
    return strUtil.unescapeStringQuote(testPath);
  }
}
SassPathProvider.id = 'SassPathProvider';
module.exports = SassPathProvider;
