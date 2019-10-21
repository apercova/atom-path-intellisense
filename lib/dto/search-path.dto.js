/**
 * DTO class for search path data
 * @author {@literal @}apercova
 * <a href="https://github.com/apercova" target="_blank">https://github.com/apercova</a>
 * <a href="https://twitter.com/apercova" target="_blank">{@literal @}apercova</a>
 * @since 1.2.0
 */
class SearchPathDTO {
    constructor(basePath, searchPath, testPath) {
        this.basePath = basePath;
        this.searchPath = searchPath;
        this.testPath = testPath;
    }
}
module.exports = SearchPathDTO;
