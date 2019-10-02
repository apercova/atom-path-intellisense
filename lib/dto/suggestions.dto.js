'use babel'

/**
 * DTO class for search suggestions data
 * @author {@literal @}apercova
 * <a href="https://github.com/apercova" target="_blank">https://github.com/apercova</a>
 * <a href="https://twitter.com/apercova" target="_blank">{@literal @}apercova</a>
 * @since 1.2.0
 */
export default class SuggestionsDTO {
  constructor(prefix, suggestions, searchPath){
    this.prefix = prefix || '';
    this.suggestions = suggestions || [];
    this.searchPath = searchPath || '.';
  }
}