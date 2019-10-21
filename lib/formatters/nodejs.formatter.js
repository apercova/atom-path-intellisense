const path = require('path');
const stringUtils = require('../util/string-utils');
const BaseFormatter = require('./base.formatter');
const SuggestionsDTO = require('../dto/suggestions.dto');

/**
 * Default formatter class
 * @author {@literal @}apercova
 * <a href="https://github.com/apercova" target="_blank">https://github.com/apercova</a>
 * <a href="https://twitter.com/apercova" target="_blank">{@literal @}apercova</a>
 * @since 1.2.0
 */
class NodeJSFormatter extends BaseFormatter {
    constructor() {
        super();
        this.id = 'NodeJSFormatter';
    }

    /**
     * format - format suggestion based on entry type
     *
     * @param  {SuggestionsDTO} rawSuggestions Raw suggestions to format
     * @param  {object} req                    Request options
     * @return {object}                        Formatted suggestions
     */
    format(rawSuggestions) {
        let fSuggestions = [];
        if (
            rawSuggestions instanceof SuggestionsDTO &&
            Array.isArray(rawSuggestions.suggestions)
        ) {
            rawSuggestions.suggestions.forEach(raw => {
                let pathType = rawSuggestions.testPath.startsWith('.')
                    ? 'relative'
                    : 'local';
                if (raw.type === 'dir') {
                    fSuggestions.push(
                        this._formatDirectory(
                            `${raw.entry}`,
                            rawSuggestions.prefix,
                            rawSuggestions.searchPath,
                            pathType
                        )
                    );
                }
                if (raw.type === 'file') {
                    fSuggestions.push(
                        this._formatFile(
                            raw.entry,
                            rawSuggestions.prefix,
                            rawSuggestions.searchPath,
                            pathType
                        )
                    );
                }
                if (raw.type === 'bimodule') {
                    fSuggestions.push(
                        this._formatBiModule(raw.entry, rawSuggestions.prefix)
                    );
                }
            });
        }
        return fSuggestions;
    }

    _formatBiModule(entry, prefix) {
        const source = 'Node.js Built-in Module:';
        return {
            displayText: entry,
            text: entry,
            replacementPrefix: stringUtils.escapeStringQuote(prefix),
            type: 'snippet',
            leftLabelHTML: '<span>&nbsp;Built-in</span>',
            rightLabelHTML: `<span class="pi-rlabel bimodule"><span class="tag">&nbsp;${source}</span> ${entry}</span>`,
            description: 'This module is provided by Node.js ..',
            descriptionMoreURL:
                'https://nodejs.org/api/modules.html#modules_module_builtinmodules',
            iconHTML: '<i class="icon-package"></i>'
        };
    }

    /**
     * _formatFile - Format a file entry
     *
     * @param  {string} entry      unformatted file entry
     * @param  {string} prefix     Replacement prefix
     * @param  {string} searchPath Base entry search path
     * @param  {string} pathType   Base entry search path type
     * @return {object}            Formated entry
     */
    _formatFile(entry, prefix, searchPath, pathType) {
        const pEntry = path.parse(entry);
        const source = pathType === 'local' ? 'Local' : 'Relative';
        return {
            displayText: stringUtils.unescapeStringQuote(pEntry.name),
            text: stringUtils.escapeStringQuote(pEntry.name),
            replacementPrefix: stringUtils.escapeStringQuote(prefix),
            type: 'class',
            leftLabelHTML: `<span>&nbsp;${source}</span>`,
            rightLabelHTML: `<span title="&nbsp;File: ${pEntry.base}" tooltip="${pEntry.base}" class="pi-rlabel file"><span class="tag">&nbsp;File:</span> ${pEntry.base}</span>`,
            description: `${path.normalize(
                searchPath + '/' + stringUtils.unescapeStringQuote(entry)
            )}`,
            iconHTML: '<i class="icon-file-code"></i>'
        };
    }

    /**
     * _formatDirectory - Format a file entry
     *
     * @param  {string} entry      unformatted directory entry
     * @param  {string} prefix     Replacement prefix
     * @param  {string} searchPath Base entry search path
     * @param  {string} pathType   Base entry search path type
     * @return {object}            Formated entry
     */
    _formatDirectory(entry, prefix, searchPath, pathType) {
        const source = pathType === 'local' ? 'Local' : 'Relative';
        return {
            displayText: stringUtils.unescapeStringQuote(entry),
            text: stringUtils.escapeStringQuote(entry),
            replacementPrefix: stringUtils.escapeStringQuote(prefix),
            type: 'class',
            leftLabelHTML: `<span>&nbsp;${source}</span>`,
            rightLabelHTML: `<span title="&nbsp;Dir: ${entry}/" class="pi-rlabel file"><span class="tag">&nbsp;Dir:</span> ${entry}/</span>`,
            description: `${path.normalize(
                searchPath + '/' + stringUtils.unescapeStringQuote(entry)
            )}`,
            iconHTML: '<i class="icon-package"></i>'
        };
    }
}
NodeJSFormatter.id = 'NodeJSFormatter';
module.exports = NodeJSFormatter;
