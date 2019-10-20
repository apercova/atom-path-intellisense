const path = require('path');
const fs = require('fs');
const logger = require('../util/logger');
const BasePathProvider = require('./base-path.provider');
const BaseFormatter = require('../formatters/base.formatter');
const DefaultFormatter = require('../formatters/default.formatter');
const SearchPathDTO = require('../dto/search-path.dto');

class CurrentFileRelativePathProvider extends BasePathProvider {
    constructor(formatter) {
        super();
        this.id = 'CurrentFileRelativePathProvider';
        this.priority = 9997;
        this.scopeSelector = '.source .string.quoted, .text.xml .string';
        this.formatter =
            formatter instanceof BaseFormatter
                ? formatter
                : new DefaultFormatter();
        this._relPathRegex = /(\/|~\/|\.\/|\.\.\/)/;
        this._logger = logger.getLogger(this.id);
    }

    /**
     * canResolve - Determines wether this provider can resolve suggestions
     *
     * @param  {object} req Request options
     * @return {object}     {@code true} if this provider can resolve suggestions. {@code false} otherwise
     */
    canResolve(req) {
        return this.$getCurrentLineUpCursor(req, true).match(this._relPathRegex)
            ? true
            : false;
    }

    /**
     * resolve - Resolve suggestions
     *
     * @param  {object} req Request options
     * @return {object}     Autocomplete suggestions
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
     * _resolveValidPathSync - Recursively resolves search path from test string
     *
     * @param  {BasePathProvider} $self    Self reference
     * @param  {object} req                Request options
     * @param  {string} testPath           String to test for path recognition
     * @param  {string} searchPath         Found search path
     * @param  {string} basePath           Search base path
     * @param  {number} idx                Iteration count index
     * @return {SearchPathDTO}             Found search path props
     */
    _resolveValidPathSync($self, req, testPath, searchPath, basePath, idx) {
        if (!testPath && !searchPath) {
            return false;
        }
        if (searchPath) {
            return new SearchPathDTO(basePath, searchPath, testPath);
        }

        idx = !isNaN(idx) ? idx : 0;
        idx++;
        testPath = testPath || '';
        $self._logger.debug(`testPath: ${testPath}`);
        const matches = testPath.match($self._relPathRegex);
        if (!matches || !matches[0]) {
            return $self._resolveValidPathSync(
                $self,
                req,
                '',
                '',
                '',
                idx
            );
        } else {
            testPath = testPath.substring(matches.index);
            $self._logger.debug(`trying ${testPath}`);

            basePath = testPath.startsWith('~/')
                ? $self.$getHomedir()
                : testPath.startsWith('/')
                    ? $self.$getCurrentProjectPath(req, true)
                    : $self.$getCurrentFilePath(req, true);
            $self._logger.debug(`basepath: ${basePath}`);

            let fullTestPath = testPath.startsWith('~/')
                ? path.normalize(
                    path.join(basePath, testPath.replace(/^~\//, ''))
                )
                : path.normalize(path.join(basePath, testPath));

            $self._logger.debug(`full path resolved as: ${fullTestPath}`);
            /* Validating existence as file or directory */
            try {
                fs.accessSync(fullTestPath, fs.constants.F_OK);
                $self._logger.debug(
                    `${fullTestPath} does exist as file or dir`
                );
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
    _resolveValidPathSyncBAK($self, req, testPath, searchPath, idx) {
        let basePath = $self.$getCurrentFilePath(req, true);
        $self._logger.debug(`basepath: ${basePath}`);
        idx = !isNaN(idx) ? idx : 0;
        idx++;
        if (searchPath) {
            return new SearchPathDTO(basePath, searchPath, testPath);
        } else if (!testPath) {
            return false;
        } else {
            const matches = testPath.match($self._relPathRegex);
            if (!matches || !matches[0]) {
                return $self._resolveValidPathSync(
                    $self,
                    req,
                    '',
                    '',
                    idx
                );
            } else {
                testPath = testPath.substring(matches.index);
                $self._logger.debug(`trying ${testPath}`);
                if (testPath.startsWith('/')) {
                    /* Adjust base path to project relative dir */
                    basePath = $self.$getCurrentProjectPath(req, true);
                    $self._logger.debug(`basepath: ${basePath}`);
                }
                let fullTestPath = path.normalize(`${basePath}/${testPath}`);
                $self._logger.debug(fullTestPath);
                /* Validating existence as file or directory */
                try {
                    fs.accessSync(fullTestPath, fs.constants.F_OK);
                    $self._logger.debug(
                        `${fullTestPath} does exist as file or dir`
                    );
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
                            idx
                        );
                    }
                }
            }
        }
    }

    /**
     * $getPrefix - Return replacement prefix
     *
     * @param  {object}        req    Request options
     * @param  {SearchPathDTO} search Search options
     * @return {string}               Replacement prefix
     */
    $getPrefix(req, search) {
        if (!(search instanceof SearchPathDTO)) {
            return '';
        }
        const regex = /[^/]+$/;
        const match = search.testPath.match(regex);
        return match ? match[0] : '';
    }
}
CurrentFileRelativePathProvider.id = 'CurrentFileRelativePathProvider';
module.exports = CurrentFileRelativePathProvider;
