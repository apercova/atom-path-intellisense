'use strict';
const logger = require('../util/logger'),
  BasePathProvider = require('./base-path.provider'),
  DefaultFormatter = require('../formatters/default.formatter');

/**
 *
 * @class
 * @Classdesc Path provider for current file path.
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
class CurrentFilePathProvider extends BasePathProvider {
  /**
   * @return {CurrentFilePathProvider} CurrentFilePathProvider instance.
   */
  constructor() {
    super();
    this.id = 'CurrentFilePathProvider';
    this.priority = 9999;
    this.scopeSelector = ['.string.quoted', '.text .string', '.text.html.basic'].join(',');
    this.formatter = new DefaultFormatter();
    this._logger = logger.getLogger(this.id);
    this._singleFileDirRegex = /^[^./].*$/;
  }

  /**
   * canResolve - Determines whether this provider can resolve suggestions based on context.
   *
   * @param  {object} req Request oprions.
   * @return {boolean}    true if this provider can resolve suggestions. false otherwise.
   */
  canResolve(req) {
    const match = this.$getCurrentLineUpCursor(req, true).match(this._singleFileDirRegex);
    return match ? true : false;
  }

  /**
   * resolve - Resolve suggestions.
   *
   * @param  {object} req Request options.
   * @return {Promise}    Promise for resolving path suggestions.
   */
  resolve(req) {
    return this.$resolveSuggestions(req, this.$resolveSearchPathSync(req));
  }

  /**
   * $getPrefix - Return replacement prefix for suggestions.
   *
   * @param  {object} req Request options.
   * @return {string}     Replacement prefix.
   */
  $getPrefix(req) {
    const regex = /[^"'/]+$/;
    const match = this.$getCurrentLineUpCursor(req, true).match(regex);
    return match ? match[0] : '';
  }
}
CurrentFilePathProvider.id = 'CurrentFilePathProvider';
module.exports = CurrentFilePathProvider;
