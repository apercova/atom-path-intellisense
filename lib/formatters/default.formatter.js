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
class DefaultFormatter extends BaseFormatter {
    constructor() {
        super();
        this.id = 'DefaultFormatter';
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
                if (raw.type === 'dir') {
                    fSuggestions.push(
                        this._formatDirectory(
                            `${raw.entry}/`,
                            rawSuggestions.prefix,
                            rawSuggestions.searchPath
                        )
                    );
                }
                if (raw.type === 'file') {
                    fSuggestions.push(
                        this._formatFile(
                            raw.entry,
                            rawSuggestions.prefix,
                            rawSuggestions.searchPath
                        )
                    );
                }
            });
        }
        return fSuggestions;
    }

    /**
     * _formatFile - Format a file entry
     *
     * @param  {string} entry      unformatted file entry
     * @param  {string} prefix     Replacement prefix
     * @param  {string} searchPath Base entry search path
     * @return {object}            Formated entry
     */
    _formatFile(entry, prefix, searchPath) {
        return {
            displayText: stringUtils.unescapeStringQuote(entry),
            text: stringUtils.escapeStringQuote(entry),
            replacementPrefix: stringUtils.escapeStringQuote(prefix),
            type: 'constant',
            rightLabelHTML:
                '<span class="pi-rlabel file"><span class="tag">&nbsp;File</span></span>',
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
     * @return {object}            Formated entry
     */
    _formatDirectory(entry, prefix, searchPath) {
        return {
            displayText: stringUtils.unescapeStringQuote(entry),
            text: stringUtils.escapeStringQuote(entry),
            replacementPrefix: stringUtils.escapeStringQuote(prefix),
            type: 'tag',
            rightLabelHTML:
                '<span class="pi-rlabel file"><span class="tag">&nbsp;Directory</span></span>',
            description: `${path.normalize(
                searchPath + '/' + stringUtils.unescapeStringQuote(entry)
            )}`,
            iconHTML: '<i class="icon-file-directory"></i>'
        };
    }
}

DefaultFormatter.id = 'DefaultFormatter';
module.exports = DefaultFormatter;
