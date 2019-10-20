'use babel';
import path from 'path';
import fs from 'fs';

import consts from './config/consts.js';
import config from './config/config.js';
import parser from './config/parser.js';

const PATH_WIN_REGEX = /(((\/|\.\/|\.\.\/)([^\\/:*?"<>|]+\/)*)([^\\/:*?"<>|]+)?)$/;
const settings = {
    /*isManualModeOn: function(){
    return (atom.config.get(`${consts.PACKAGE_NAME}.${const.CF_MANUAL_SUGGEST}`) === true);
  },*/
    /*ispathEnforcingOn: function(){
    return (atom.config.get(`${consts.PACKAGE_NAME}.${CFG_ENFORCE_PATH}`) === true);
  }*/
};

const _fn = {
    getFilePath: function(req) {
        let filepath = false;
        let line = this.getCursorCurrentLine(req) || '';
        /*unescape quotes on names*/
        line = this.unescapeStringQuote(line);
        filepath = line.match(PATH_WIN_REGEX) || false;
        if (filepath) {
            filepath = {
                path: filepath[1],
                dir: filepath[2],
                file: filepath[5] || ''
            };
        }
        return filepath;
    },
    getCursorCurrentLine: function(req) {
        return req.editor.getTextInRange([
            [req.bufferPosition.row, 0],
            req.bufferPosition
        ]);
    },
    getProyectDir: function(req) {
        const filepath = req.editor.getPath();
        const projectdir = atom.project
            .getDirectories()
            .filter(testpath => filepath.indexOf(testpath.path) > -1)
            .reduce(
                (found, testpath) => found ? found : testpath.path,
                false
            );
        return projectdir;
    },
    getFileDir: function(req) {
        const filepath = req.editor.getPath();
        return path.parse(filepath).dir;
    },
    resolveSearchPath: function(req, filepath) {
        const self = this;
        let promize = new Promise(function(resolve, reject) {
            let basedir;
            if (filepath.dir.startsWith('/')) {
                /*Project root directory*/
                basedir = self.getProyectDir(req);
            } else {
                /*Current file directory*/
                basedir = self.getFileDir(req);
            }
            /*Make readonly*/
            const basepath = path.normalize(
                `${basedir}${path.sep}${filepath.path}`
            );
            let searchpath = false;

            fs.access(basepath, fs.constants.F_OK, err => {
                if (!err) {
                    /*If base path can be found at filesystem and is a file,
            resolve parent dir path*/
                    fs.stat(basepath, function(err, pathstats) {
                        if (!err) {
                            if (!pathstats.isDirectory()) {
                                searchpath = path.parse(basepath).dir;
                                resolve(searchpath);
                            } else {
                                if (basepath.endsWith(path.sep)) {
                                    searchpath = basepath;
                                    resolve(searchpath);
                                } else {
                                    /*Prevents from searching existing directory without specifying
                                     * forward slash in order to avoid inner search when having
                                     * pattern-like sub directories*/
                                    searchpath = path.parse(basepath).dir;
                                    resolve(searchpath);
                                }
                            }
                        } else {
                            /*Reading error*/
                            reject();
                        }
                    });
                } else {
                    /*If base path can not be found at filesystem,
            (ej. incomplete file name) resolve parent dir path only if exists*/
                    if (!basepath.endsWith(path.sep)) {
                        /*Only resolve for incomplete file names*/
                        searchpath = path.parse(basepath).dir;
                        fs.access(searchpath, fs.constants.F_OK, err => {
                            if (!err) {
                                resolve(searchpath);
                            } else {
                                reject(`Not found: ${basepath}`);
                            }
                        });
                    } else {
                        reject(`Not found: ${basepath}`);
                    }
                }
            });
        });
        return promize;
    },
    unescapeStringQuote: function(str) {
        str = str.replace(new RegExp(/\\'/, 'g'), "'");
        str = str.replace(new RegExp(/\\"/, 'g'), '"');
        return str;
    },
    escapeStringQuote: function(str) {
        str = str.replace(new RegExp(/'/, 'g'), "\\'");
        str = str.replace(new RegExp(/"/, 'g'), '\\"');
        return str;
    },
    formatFile: function(req, filename, replacement) {
        return {
            displayText: this.unescapeStringQuote(filename),
            text: this.escapeStringQuote(filename),
            replacementPrefix: this.escapeStringQuote(replacement),
            type: 'tag',
            leftLabelHTML: '<span class="pi-rlabel file">File</span>'
        };
    },
    formatDirectory: function(req, dirname, replacement) {
        return {
            displayText: this.unescapeStringQuote(dirname),
            text: this.escapeStringQuote(dirname),
            replacementPrefix: this.escapeStringQuote(replacement),
            type: 'tag',
            leftLabelHTML: '<span class="pi-rlabel directory">Directory</span>'
        };
    },
    resolveSuggestions: function(req) {
        const self = this;
        const promize = new Promise(function(resolve, reject) {
            let filepath = self.getFilePath(req);
            if (filepath) {
                self.resolveSearchPath(req, filepath)
                    .then(function(searchpath) {
                        const suggestions = [];
                        suggestions.push(
                            self.formatDirectory(req, '../', filepath.file)
                        );
                        fs.readdir(searchpath, function(e, entries) {
                            entries.forEach(function(entry) {
                                let entryStats = fs.statSync(
                                    path.resolve(searchpath, entry)
                                );
                                if (entryStats) {
                                    if (entryStats.isDirectory()) {
                                        suggestions.push(
                                            self.formatDirectory(
                                                req,
                                                `${entry}/`,
                                                filepath.file
                                            )
                                        );
                                    }
                                    if (entryStats.isFile()) {
                                        suggestions.push(
                                            self.formatFile(
                                                req,
                                                entry,
                                                filepath.file
                                            )
                                        );
                                    }
                                }
                            });
                            /*Natural order suggestions sort*/
                            suggestions.sort(function(a, b) {
                                return a.text.localeCompare(b.text);
                            });
                            resolve(suggestions);
                        });
                    })
                    .catch(function(e) {
                        reject(e);
                    });
            }
        });
        return promize;
    },
    getSuggestions: function(req, providers) {
        this._logger.debug('getSuggestions');
        this._logger.debug(providers);
        let filepath;
        let line = this.getCursorCurrentLine(req) || '';
        line = this.unescapeStringQuote(line);
        filepath = line.match(parser.patterns.pathregex) || false;
        var promize = new Promise(function(resolve) {
            resolve([]);
        });
        return promize;
    },
    getSuggestionsBak: function(req) {
        const self = this;
        var promize = new Promise(function(resolve, reject) {
            let invoke = false;

            if (!settings.isManualModeOn()) {
                invoke = true;
            } else {
                if (req.activatedManually) {
                    invoke = true;
                }
            }

            if (invoke) {
                self.resolveSuggestions(req)
                    .then(function(suggestions) {
                        resolve(suggestions);
                    })
                    .catch(function() {

                    });
            }
        });
        return promize;
    }
};

export default class DefaultPathProvider {
    constructor(pkg) {
        this.package = pkg;
        this.loadConfig();
    }
}
DefaultPathProvider.prototype.loadConfig = function() {
    this.selector = atom.config.get(
        `${consts.PACKAGE_NAME}.${consts.CF_ALLOWED_SCOPES}`
    );
    this.disableForSelector = config.getDisabledScopes();
    this.inclusionPriority = config.getInclusionPriority();
    this.excludeLowerPriority = config.excludeLowerPrioritySuggestions();
    this.suggestionPriority = config.getSuggestionPriority();
    this.filterSuggestions = config.filterSuggestions();
};
DefaultPathProvider.prototype.getSuggestions = function(req) {
    //const editor = atom.workspace.getActiveTextEditor();
    //const valueAtCursor = atom.config.get('atom-path-intellisense.pattern', {scope: cursor.getScopeDescriptor()});
    //console.dir(valueAtCursor);
    return _fn.getSuggestions(req, this.package.pathProviders);
};
DefaultPathProvider.prototype.dispose = function() {};
