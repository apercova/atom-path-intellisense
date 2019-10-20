'use babel';
import path from 'path';
import fs from 'fs';

const PACKAGE_NAME = 'atom-path-intellisense';
const CFG_MANUAL_SUGGEST = 'manual-suggest';
const CFG_ENFORCE_PATH = 'enforce-path';
const CFG_SCOPE_DESCRIPTORS = 'scope-descriptors';
const CURSOR_PATH_REGEX = /(((\.\.\/|\.\/|\/)([^\\/:*?"<>|]+\/)*)([^\\/:*?"<>|]+)?$)/;
const ALL_SCOPES_REGEX = /^\s*\*\s*$/;

const settings = {
    isManualModeOn: function() {
        return (
            atom.config.get(`${PACKAGE_NAME}.${CFG_MANUAL_SUGGEST}`) === true
        );
    },
    ispathEnforcingOn: function() {
        return atom.config.get(`${PACKAGE_NAME}.${CFG_ENFORCE_PATH}`) === true;
    },
    inAValidScope: function(testScopes) {
        testScopes = testScopes || [''];
        const confScopes = atom.config.get(
            `${PACKAGE_NAME}.${CFG_SCOPE_DESCRIPTORS}`
        );
        let res = false;
        for (let i = 0; i < confScopes.length; i++) {
            if (settings.isInScopes(confScopes[i], testScopes)) {
                res = true;
                break;
            }
        }
        return res;
    },
    isInScopes: function(scope, testScopes) {
        scope = scope || '*';
        testScopes = testScopes || ['*'];
        let res = false;
        for (let i = 0; i < testScopes.length; i++) {
            let curr = testScopes[i];
            if (curr.match(ALL_SCOPES_REGEX) !== null) {
                res = true;
                break;
            }
            if (curr.indexOf(scope) > -1) {
                res = true;
                break;
            }
        }
        return res;
    }
};

const fn = {
    resolveSuggestions: function(req) {
        const parsedPath = this.parseCursorPath(req);
        let promize;
        if (parsedPath) {
            promize = this.resolvePathSuggestions(req, parsedPath);
        }
        return promize;
    },
    resolvePathSuggestions: function(req, parsedPath) {
        const self = this;
        const cursorPath = self.getCursorCurrentPath(parsedPath);
        const promize = new Promise(function(resolve) {
            const suggestions = [];
            self.resolveSearchPath(req, cursorPath)
                .then(function(searchPath) {
                    //Fixed parent dir
                    suggestions.push(
                        self.formatDirectory('../', req, parsedPath)
                    );
                    //Seeking searchPath for files and directories/
                    const entries = fs.readdirSync(searchPath);
                    entries.forEach(function(entry) {
                        try {
                            let entryStats = fs.statSync(
                                path.normalize(
                                    `${searchPath}${path.sep}${entry}`
                                )
                            );
                            if (entryStats) {
                                if (entryStats.isDirectory()) {
                                    suggestions.push(
                                        self.formatDirectory(
                                            `${entry}/`,
                                            req,
                                            parsedPath
                                        )
                                    );
                                }
                                if (entryStats.isFile()) {
                                    suggestions.push(
                                        self.formatFile(entry, req, parsedPath)
                                    );
                                }
                            }
                        } catch (e) {
                            throw 'unable to read a file entry.', e;
                        }
                    });
                    /*Natural order suggestions sort*/
                    suggestions.sort(function(a, b) {
                        return a.text.localeCompare(b.text);
                    });
                    resolve(suggestions);
                })
                .catch(function() {
                    resolve(suggestions);
                });
        });
        return promize;
    },
    resolveSearchPath: function(req, cursorPath) {
        const self = this;
        const promize = new Promise(function(resolve, reject) {
            try {
                let basePath;
                if (cursorPath.startsWith('/')) {
                    /*Proyect base directory*/
                    basePath = path.parse(
                        self.getProyectRoot(req.editor.getPath())
                    );
                } else {
                    /*Current file directory*/
                    basePath = path.parse(path.parse(req.editor.getPath()).dir);
                }
                //Constructs complete path
                let searchPath = path.normalize(
                    `${path.format(basePath)}${path.sep}${cursorPath}`
                );

                if (fs.existsSync(searchPath)) {
                    let pathStats = fs.statSync(searchPath);
                    if (pathStats && pathStats.isDirectory()) {
                        resolve(searchPath);
                    }
                    /*else {//NOTE: no tiene caso si ya se resolvio todo el archivo
            //If search path can be found at filesystem, but is a file,
            //resolve parent dir path
            console.error(path.normalize(path.parse(searchPath).dir));
            resolve(path.normalize(path.parse(searchPath).dir));
          }*/
                } else {
                    /*If search path can not be found at filesystem,
          (ej. incomplete file name) resolve parent dir path*/
                    if (!cursorPath.endsWith('/')) {
                        /*Only resolve for incomplete file names*/
                        resolve(path.normalize(path.parse(searchPath).dir));
                    }
                }
            } catch (e) {
                //reject(e);
                /*If search path can not be determined, log warn and try to resolve
        current dir path, otherrwise reject with an error*/
                try {
                    const basePath = path.parse(
                        path.parse(req.editor.getPath()).dir
                    );
                    const searchPath = path.normalize(path.format(basePath));

                    resolve(searchPath);
                } catch (e) {
                    reject(e);
                }
            }
        });
        return promize;
    },
    getFullPath: function(cursorPath) {
        return cursorPath !== null ? cursorPath[1] : null;
    },
    getReplacementPrefix: function(req, parsedPath) {
        return this.getCursorCurrentFile(parsedPath);
    },
    formatFile: function(file, req, parsedPath) {
        return {
            displayText: this.unescapeStringQuote(file),
            text: this.escapeStringQuote(file),
            replacementPrefix: this.escapeStringQuote(
                this.getReplacementPrefix(req, parsedPath) || ''
            ),
            type: 'tag',
            leftLabelHTML: '<span class="pi-rlabel file">File</span>'
        };
    },
    formatDirectory: function(dir, req, parsedPath) {
        return {
            displayText: this.unescapeStringQuote(dir),
            text: this.escapeStringQuote(dir),
            replacementPrefix: this.escapeStringQuote(
                this.getReplacementPrefix(req, parsedPath) || ''
            ),
            type: 'tag',
            leftLabelHTML: '<span class="pi-rlabel directory">Directory</span>'
        };
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
    parseCursorPath: function(req) {
        let cursorPath = this.getCurrentLine(req) || '';
        /*unescape quotes on names*/
        cursorPath = this.unescapeStringQuote(cursorPath);
        cursorPath = CURSOR_PATH_REGEX.exec(cursorPath);
        return cursorPath;
    },
    getCurrentLine: function(req) {
        return req.editor.getTextInRange([
            [req.bufferPosition.row, 0],
            req.bufferPosition
        ]);
    },
    getProyectRoot: function(path) {
        path = path || '';
        let root = './';
        let dirs = atom.project.getDirectories();
        if (path.length > 0) {
            for (let i = 0; i < dirs.length; i++) {
                let dir = dirs[i];
                if (path.indexOf(dir.path) > -1) {
                    root = dir.path;
                    break;
                }
            }
        }
        return root;
    },
    isCursorInPath: function(parsedPath) {
        return parsedPath !== null;
    },
    getCursorCurrentPath: function(parsedPath) {
        return parsedPath !== null ? parsedPath[1] : null;
    },
    getCursorCurrentDir: function(parsedPath) {
        return parsedPath !== null ? parsedPath[2] : null;
    },
    getCursorCurrentFile: function(parsedPath) {
        return parsedPath !== null ? parsedPath[5] : null;
    }
};

module.exports = {
    selector: '*',
    inclusionPriority: 1,
    excludeLowerPriority: false,
    suggestionPriority: 1,
    filterSuggestions: true,
    getSuggestions: function(req) {
        let suggestions;
        if (settings.inAValidScope(req.scopeDescriptor.scopes)) {
            if (!settings.isManualModeOn()) {
                suggestions = fn.resolveSuggestions(req);
            } else {
                if (req.activatedManually) {
                    suggestions = fn.resolveSuggestions(req);
                }
            }
        }
        return suggestions;
    }
};
