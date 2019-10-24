'use strict';
/**
 *
 * @class
 * @Classdesc Base formatter.
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
class BaseFormatter {
  /**
   * @return {BaseFormatter} BaseFormatter instance.
   * Meant to format raw suggestions.
   */
  constructor() {}

  /**
   * format - format suggestions based on entry type.
   *
   * @return {Array} Formatted suggestions.
   */
  format() {
    throw 'Not implemented in base class!';
  }
}
module.exports = BaseFormatter;
