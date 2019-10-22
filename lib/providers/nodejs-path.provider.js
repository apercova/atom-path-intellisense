'use strict';
const path = require('path');
const fs = require('fs');
const mod = require('module');
const { exec } = require('child_process');
const logger = require('../util/logger');
const BasePathProvider = require('./base-path.provider');
const BaseFormatter = require('../formatters/base.formatter');
const DefaultFormatter = require('../formatters/default.formatter');
const SuggestionsDTO = require('../dto/suggestions.dto');
const SearchPathDTO = require('../dto/search-path.dto');

/**
 *
 * @class
 * @Classdesc Path provider for Node.js modules.
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
class NodeJSPathProvider extends BasePathProvider {
    /**
     * @param  {BaseFormatter}      formatter Formatter instance.
     * @return {NodeJSPathProvider}           NodeJSPathProvider instance.
     */
    constructor(formatter) {
        super();
        this.id = 'NodeJSPathProvider';
        this.priority = 9991;
        this.scopeSelector = '.source.js .string.quoted';
        this.formatter =
            formatter instanceof BaseFormatter
                ? formatter
                : new DefaultFormatter();
        this.fileExtFilter = ['.js'];
        this._logger = logger.getLogger(this.id);
        this._builtinModules = [];
        this._global_node_modules = '';
        this._requirePatternRegex = /require\(['"](.*?)['"]\)/;
        this._importPatternRegex = /import.*?from.*?['"](.*?)['"]/;
        this._prefixRegex = /([^/]+?)$/;
        this._biModRegex = /^[^~./].*$/;
        this._biModPrefixRegex = /([^'"]+?)$/;
    }

    /**
     * canResolve - Determines whether this provider can resolve suggestions based on context.
     *
     * @param  {object} req Request oprions.
     * @return {boolean}    true if this provider can resolve suggestions. false otherwise.
     */
    canResolve(req) {
        const line = this.$getCurrentLine(req, true);
        if (line.match(this._requirePatternRegex)) {
            return true;
        }
        let match = line.match(this._importPatternRegex);
        if (match && match[1]) {
            return match[1].match(this._biModRegex) ? true : false;
        }
        return false;
    }

    /**
     * resolve - Resolve suggestions.
     *
     * @param  {object} req Request options.
     * @return {Promise}    Promise for resolving path suggestions.
     */
    resolve(req) {
        const self = this;
        return new Promise((resolve, reject) => {
            self.$resolveSuggestions(req, self.$resolveSearchPathSync(req))
                .then(suggestions => {
                    if (self._getTestPath(req).match(self._biModRegex)) {
                        const biModSuggestions = self._resolveBuiltInModuleSuggestions(
                            req
                        );
                        suggestions = suggestions.concat(biModSuggestions);
                    }
                    resolve(suggestions);
                })
                .catch(e => {
                    self._logger.warn(e);
                    reject(e);
                });
        });
    }

    /**
     * activate - Provides a mechanism to initialize provider dependencies.
     *
     * @return {Promise} A promise for provider activation.
     */
    activate() {
        let self = this;
        return new Promise((resolve, reject) => {
            try {
                self._builtinModules = mod._builtinModules;
                exec('npm root -g', (err, stdout, stderr) => {
                    if (err) {
                        self._logger.warn(err);
                    } else {
                        self._logger.debug(`npm root -g stdout: ${stdout}`);
                        if (stderr) {
                            self._logger.warn('npm root -g stderr:');
                            self._logger.warn(stderr);
                        }
                        self._global_node_modules = path.format(
                            path.parse(`${stdout}`.trim())
                        );
                        self._logger.debug(
                            `Global node_modules path: ${self._global_node_modules}`
                        );
                        resolve(this);
                    }
                });
            } catch (e) {
                reject({
                    error: e,
                    provider: this
                });
            }
        });
    }

    /**
     * resolveSearchPathSync - Resolves search path in a sync way.
     *
     * @param  {object} req    Request options.
     * @return {SearchPathDTO} Search path.
     */
    $resolveSearchPathSync(req) {
        let testPath = this._getTestPath(req);
        this._logger.debug(`trying ${testPath}`);

        let basePath = testPath.startsWith('~/')
            ? this.$getHomedir()
            : testPath.startsWith('.')
                ? this.$getCurrentFilePath(req)
                : this._getProjectNodeModulesDir(req);
        this._logger.debug(`basepath: ${basePath}`);

        let fullTestPath = testPath.startsWith('~/')
            ? path.normalize(path.join(basePath, testPath.replace(/^~\//, '')))
            : path.normalize(path.join(basePath, testPath));

        this._logger.debug(`full path resolved as: ${fullTestPath}`);

        let searchPath = '';
        /* Validating existence as file or directory */
        try {
            fs.accessSync(fullTestPath, fs.constants.F_OK);
            this._logger.debug(`${fullTestPath} does exist as file or dir`);
            /* Path does exist, validate if file or dir */
            let stats = fs.statSync(fullTestPath);
            if (!stats.isDirectory()) {
                /* Pathis a file, return parent dir*/
                this._logger.debug(`${fullTestPath} is a file`);
                searchPath = path.parse(fullTestPath).dir;
            } else {
                /* Pathis a dir, return it*/
                this._logger.debug(`${fullTestPath} is a dir`);
                searchPath = fullTestPath;
            }
        } catch (e) {
            /* testPath neither exists as file nor directory
             * Validating existence of parent directory */
            this._logger.warn(e);
            this._logger.debug(
                `${fullTestPath} does not exist as file nor dir`
            );
            if (!testPath.endsWith('/')) {
                /* Prevents searching on parent directory if test path is a directory */
                searchPath = path.parse(fullTestPath).dir;
                try {
                    fs.accessSync(searchPath, fs.constants.F_OK);
                    /* Path parent dir exists, return it */
                    this._logger.debug(
                        `${searchPath} does exist as parent dir`
                    );
                } catch (e) {
                    /* Path parent dir does not exist, return fullPath*/
                    this._logger.debug(
                        `${searchPath} does not exist as parent dir`
                    );
                    searchPath = fullTestPath;
                }
            } else {
                /* No path exists at all, return fullPath*/
                this._logger.debug('No path exists at all');
                searchPath = fullTestPath;
            }
        }
        return new SearchPathDTO(basePath, searchPath, testPath);
    }

    /**
     * $getPrefix - Return replacement prefix for suggestions.
     *
     * @param  {object} req Request options.
     * @return {string}     Replacement prefix.
     */
    $getPrefix(req) {
        const match = this._getTestPath(req).match(this._prefixRegex);
        return match ? match[0] : '';
    }

    /**
     * $getPrefix - Return replacement prefix for Node.js Built-in modules suggestions.
     *
     * @param  {object} req Request options.
     * @return {string}     Replacement prefix.
     */
    _getBiModPrefix(req) {
        return this._getTestPath(req);
    }

    /**
     * _getTestPath - Returns possible path for provider based on context.
     *
     * @param  {object} req Request options.
     * @return {string}     Possible path for provider based on context.
     */
    _getTestPath(req) {
        const line = this.$getCurrentLine(req);
        let testPath = '';
        let match = line.match(this._requirePatternRegex);
        if (match) {
            testPath = match[1];
        }
        match = line.match(this._importPatternRegex);
        if (match) {
            testPath = match[1];
        }
        return testPath;
    }

    /**
     * _getProjectNodeModulesDir - Returns Node.js node_modules dir for current project dir.
     *
     * @param  {object} req Request options.
     * @return {string}     Node.js node_modules dir for current project dir.
     */
    _getProjectNodeModulesDir(req) {
        return path.join(
            this.$getCurrentProjectPath(req, true, true),
            'node_modules'
        );
    }

    /**
     * _resolveBuiltInModuleSuggestions - Resolves suggestions for Node.js Built-in modules.
     *
     * @param  {object}         req Request options.
     * @return {SuggestionsDTO}     Suggestions.
     */
    _resolveBuiltInModuleSuggestions(req) {
        let result = new SuggestionsDTO(
            this._getBiModPrefix(req),
            [],
            this.$getCurrentFilePath(req),
            this._getTestPath(req)
        );
        if (Array.isArray(this._builtinModules)) {
            this._builtinModules.forEach(mod => {
                result.suggestions.push({ type: 'bimodule', entry: mod });
            });
        }
        return this.formatter.format(result);
    }
}
NodeJSPathProvider.id = 'NodeJSPathProvider';
module.exports = NodeJSPathProvider;
