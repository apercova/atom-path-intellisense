/**
 * Base formatter class
 * @author {@literal @}apercova
 * <a href="https://github.com/apercova" target="_blank">https://github.com/apercova</a>
 * <a href="https://twitter.com/apercova" target="_blank">{@literal @}apercova</a>
 * @since 1.2.0
 */
class BaseFormatter {
  constructor() {}

  /**
   * format - format suggestion based on entry type
   *
   * @param  {SuggestionsDTO} rawSuggestions Raw suggestions to format
   * @param  {object} req                    Request options
   * @return {object}                        Formatted suggestions
   */
  format(rawSuggestions, req) {
    throw "Not implemented in base class!";
  }
}
module.exports = BaseFormatter;
