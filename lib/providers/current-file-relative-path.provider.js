'use strict';
const path = require('path');
const fs = require('fs');
const settings = require('../config/settings');
const consts = require('../config/consts');
const logger = require('../util/logger');
const BasePathProvider = require('./base-path.provider');
const BaseFormatter = require('../formatters/base.formatter');
const DefaultFormatter = require('../formatters/default.formatter');
const SearchPathDTO = require('../dto/search-path.dto');

/**
 *
 * @class
 * @Classdesc Path provider for paths relative to current file path.
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
class CurrentFileRelativePathProvider extends BasePathProvider {
    /**
     * @param  {BaseFormatter}                   formatter Formatter instance.
     * @return {CurrentFileRelativePathProvider}           CurrentFileRelativePathProvider instance.
     */
    constructor(formatter) {
        super();
        this.id = 'CurrentFileRelativePathProvider';
        this.priority = 9997;
        this.scopeSelector = settings[`${consts.CF_ALLOWED_SCOPES}`].default;
        this.formatter =
            formatter instanceof BaseFormatter
                ? formatter
                : new DefaultFormatter();
        this._logger = logger.getLogger(this.id);
        this._relPathRegex = /(\/|~\/|\.\/|\.\.\/)/;
        this._prefixRegex = /[^/]+$/;
    }

    /**
     * canResolve - Determines whether this provider can resolve suggestions based on context.
     *
     * @param  {object} req Request oprions.
     * @return {boolean}    true if this provider can resolve suggestions. false otherwise.
     */
    canResolve(req) {
        return this.$getCurrentLineUpCursor(req, true).match(this._relPathRegex)
            ? true
            : false;
    }

    /**
     * resolve - Resolve suggestions.
     *
     * @param  {object} req Request options.
     * @return {Promise}    Promise for resolving path suggestions.
     */
    resolve(req) {
        return this.$resolveSuggestions(
            req,
            this._resolveValidPathSync(
                this,
                req,
                this.$getCurrentLineUpCursor(req, true)
            )
        );
    }

    /**
     * $getPrefix - Return replacement prefix for suggestions.
     *
     * @param  {object}        req    Request options.
     * @param  {SearchPathDTO} search Search options
     * @return {string}               Replacement prefix.
     */
    $getPrefix(req, search) {
        let prefix = '';
        if (search instanceof SearchPathDTO) {
            const match = search.testPath.match(this._prefixRegex);
            prefix = match ? match[0] : '';
        }
        return prefix;
    }

    /**
     * _resolveValidPathSync - Recursively resolves search path from a test string.
     *
     * @param  {BasePathProvider} $self      Self reference.
     * @param  {object}           req        options.
     * @param  {string}           testPath   to test for path recognition.
     * @param  {string}           searchPath search path.
     * @param  {string}           basePath   base path.
     * @param  {number}           idx        count index.
     * @return {SearchPathDTO}               Found search path.
     */
    _resolveValidPathSync($self, req, testPath, searchPath, basePath, idx) {
        if (searchPath) {
            return new SearchPathDTO(basePath, searchPath, testPath);
        }
        if (!testPath && !searchPath) {
            return null;
        }

        idx = !isNaN(idx) ? idx : 0;
        idx++;
        testPath = testPath || '';
        $self._logger.debug(`testPath: ${testPath}`);
        const matches = testPath.match($self._relPathRegex);
        if (!matches || !matches[0]) {
            return null;
        }

        testPath = testPath.substring(matches.index);
        $self._logger.debug(`trying ${testPath}`);

        basePath = testPath.startsWith('~/')
            ? $self.$getHomedir()
            : testPath.startsWith('/')
                ? $self.$getCurrentProjectPath(req, true)
                : $self.$getCurrentFilePath(req, true);
        $self._logger.debug(`basepath: ${basePath}`);

        let fullTestPath = testPath.startsWith('~/')
            ? path.normalize(path.join(basePath, testPath.replace(/^~\//, '')))
            : path.normalize(path.join(basePath, testPath));

        $self._logger.debug(`full path resolved as: ${fullTestPath}`);
        /* Validating existence as file or directory */
        try {
            fs.accessSync(fullTestPath, fs.constants.F_OK);
            $self._logger.debug(`${fullTestPath} does exist as file or dir`);
            /* Path does exist, validate if file or dir */
            let stats = fs.statSync(fullTestPath);
            if (!stats.isDirectory()) {
                $self._logger.debug(`${fullTestPath} is a file`);
                fullTestPath = path.parse(fullTestPath).dir;
                return $self._resolveValidPathSync(
                    $self,
                    req,
                    testPath,
                    fullTestPath,
                    basePath,
                    idx
                );
            } else {
                $self._logger.debug(`${fullTestPath} is a dir`);
                if (testPath.endsWith('/')) {
                    return $self._resolveValidPathSync(
                        $self,
                        req,
                        testPath,
                        fullTestPath,
                        basePath,
                        idx
                    );
                } else {
                    /*
                     * Fix to allow searching existing directory while not specifying
                     * forward slash in order to avoid change back directory when use
                     * back directory name (..)
                     */
                    fullTestPath = path.parse(fullTestPath).dir;
                    return $self._resolveValidPathSync(
                        $self,
                        req,
                        testPath,
                        fullTestPath,
                        basePath,
                        idx
                    );
                }
            }
        } catch (e) {
            $self._logger.warn(e);
            $self._logger.debug(
                `${fullTestPath} does not exist as file nor dir`
            );
            /* testPath neither exists as file nor directory
             * Validating existence of parent directory */
            if (!testPath.endsWith('/')) {
                /* Prevents searching on parent directory if test path is a directory */
                fullTestPath = path.parse(fullTestPath).dir;
                try {
                    fs.accessSync(fullTestPath, fs.constants.F_OK);
                    $self._logger.debug(
                        `${fullTestPath} does exist as parent dir`
                    );
                    /* Path exists as parent dir, return match */
                    return $self._resolveValidPathSync(
                        $self,
                        req,
                        testPath,
                        fullTestPath,
                        basePath,
                        idx
                    );
                } catch (e) {
                    $self._logger.warn(e);
                    $self._logger.debug(
                        `${fullTestPath} does not exist as parent dir`
                    );
                    /* Path does not exist as parent dir, trying next match */
                    testPath = testPath.substring(matches[0].length);
                    return $self._resolveValidPathSync(
                        $self,
                        req,
                        testPath,
                        '',
                        basePath,
                        idx
                    );
                }
            } else {
                /* No path exists at all, trying next match */
                testPath = testPath.substring(matches[0].length);
                return $self._resolveValidPathSync(
                    $self,
                    req,
                    testPath,
                    '',
                    basePath,
                    idx
                );
            }
        }
    }
}
CurrentFileRelativePathProvider.id = 'CurrentFileRelativePathProvider';
module.exports = CurrentFileRelativePathProvider;
