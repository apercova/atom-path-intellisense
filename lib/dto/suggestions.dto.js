'use strict';
/**
 *
 * @class
 * @Classdesc DTO class for search suggestions.
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
class SuggestionsDTO {
  /**
   * @param  {string} prefix     Prefix for suggestion replacemet.
   * @param  {Array} suggestions Suggestions.
   * @param  {string} searchPath Full search path.
   * @param  {string} testPath   Possible path for testing existence.
   * @return {SuggestionsDTO}    SuggestionsDTO instance.
   */
  constructor(prefix, suggestions, searchPath, testPath) {
    this.prefix = prefix || '';
    this.suggestions = suggestions || [];
    this.searchPath = searchPath || '.';
    this.testPath = testPath || '';
  }
}
module.exports = SuggestionsDTO;
