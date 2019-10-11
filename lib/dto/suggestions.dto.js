/**
 * DTO class for search suggestions data
 * @author {@literal @}apercova
 * <a href="https://github.com/apercova" target="_blank">https://github.com/apercova</a>
 * <a href="https://twitter.com/apercova" target="_blank">{@literal @}apercova</a>
 * @since 1.2.0
 */
class SuggestionsDTO {
  constructor(prefix, suggestions, searchPath, testPath){
    this.prefix = prefix || '';
    this.suggestions = suggestions || [];
    this.searchPath = searchPath || '.';
    this.testPath = testPath || '';
  }
}
module.exports = SuggestionsDTO;
