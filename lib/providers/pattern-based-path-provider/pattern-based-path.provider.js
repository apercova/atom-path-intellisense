const path = require('path');
const fs = require('fs');
const logger = require('../../util/logger');
const BasePathProvider = require('../base-path.provider');
const BaseFormatter = require('../../formatters/default.formatter');
const DefaultFormatter = require('../../formatters/base.formatter');
const SuggestionsDTO = require('../../dto/suggestions.dto');

class PatternBasedPathProvider extends BasePathProvider {
    constructor(formatter) {
        super();
        this.id = 'PatternBasedPathProvider';
        this.priority = 9999;
        this.scopeSelector = '.source .string.quoted, .text.xml .string';
        this.formatter =
            formatter instanceof BaseFormatter
                ? formatter
                : new DefaultFormatter();
        this._logger = logger.getLogger('PatternBasedPathProvider');
    }

    canResolve(req) {
        return this.$getCurrentLine(req, true) ? true : false;
    }

    resolve(req) {
        const self = this;
        const promize = new Promise((resolve, reject) => {
            const searchPath = self.$getCurrentFilePath(req, true);
            const result = new SuggestionsDTO(this.$getPrefix(req));
            if (searchPath) {
                try {
                    fs.readdir(searchPath, (e, entries) => {
                        if (e) {
                            self._logger.warn(e);
                        }
                        result.suggestions.push({ type: 'dir', entry: '..' });
                        entries.forEach(entry => {
                            let entryStats = fs.statSync(
                                path.resolve(searchPath, entry)
                            );
                            if (entryStats) {
                                if (entryStats.isFile()) {
                                    result.suggestions.push({
                                        type: 'file',
                                        entry: entry
                                    });
                                }
                                if (entryStats.isDirectory()) {
                                    result.suggestions.push({
                                        type: 'dir',
                                        entry: entry
                                    });
                                }
                            }
                        });
                        /*Natural order suggestions sort*/
                        result.suggestions = result.suggestions.sort((a, b) =>
                            a.entry.localeCompare(b.entry)
                        );
                        resolve(self.formatter.format(result));
                    });
                } catch (e) {
                    self._logger.warn(e);
                    reject(e);
                }
            } else {
                resolve(self.formatter.format(result));
            }
        });
        return promize;
    }
}
PatternBasedPathProvider.id = PatternBasedPathProvider;
module.exports = PatternBasedPathProvider;
