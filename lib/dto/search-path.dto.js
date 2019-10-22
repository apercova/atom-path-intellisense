'use strict';
/**
 *
 * @description DTO class for search path.
 * @module dto/SearchPathDTO
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
class SearchPathDTO {

    /**
     * constructor -
     *
     * @param  {string} basePath   Base path for search.
     * @param  {string} searchPath Full search path.
     * @param  {string} testPath   Possible path for testing existence.
     * @return {SearchPathDTO}     SearchPathDTO instance.
     */
    constructor(basePath, searchPath, testPath) {
        this.basePath = basePath;
        this.searchPath = searchPath;
        this.testPath = testPath;
    }
}
module.exports = SearchPathDTO;
