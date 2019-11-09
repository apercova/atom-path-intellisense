'use strict';
const path = require('path'),
  stringUtils = require('../util/string-utils'),
  BaseFormatter = require('./base.formatter'),
  SuggestionsDTO = require('../dto/suggestions.dto');

/**
 *
 * @class
 * @Classdesc Default formatter.
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
class DefaultFormatter extends BaseFormatter {
  /**
   * @param  {object} config    Config options.
   * @return {DefaultFormatter} DefaultFormatter instance.
   * Meant to format raw suggestions for files and directories.
   */
  constructor(config) {
    super();
    this.id = 'DefaultFormatter';
    this.config = config || {};
  }

  /**
   * format - format suggestions based on entry type.
   *
   * @param  {SuggestionsDTO} rawSuggestions Raw suggestions to format.
   * @return {Array}                         Formatted suggestions.
   */
  format(rawSuggestions) {
    let fSuggestions = [];
    if (rawSuggestions instanceof SuggestionsDTO && Array.isArray(rawSuggestions.suggestions)) {
      rawSuggestions.suggestions.forEach(raw => {
        if (raw.type === 'dir') {
          fSuggestions.push(this._formatDirectory(`${raw.entry}/`, rawSuggestions.prefix, rawSuggestions.searchPath));
        }
        if (raw.type === 'file') {
          fSuggestions.push(this._formatFile(`${raw.entry}`, rawSuggestions.prefix, rawSuggestions.searchPath));
        }
      });
    }
    return fSuggestions;
  }

  /**
   * _formatFile - Format a file entry.
   *
   * @param  {string} entry      unformatted file entry.
   * @param  {string} prefix     Replacement prefix.
   * @param  {string} searchPath Base entry search path.
   * @return {object}            Formated entry.
   */
  _formatFile(entry, prefix, searchPath) {
    const pEntry = path.parse(entry);
    let rlabel = '<span class="pi-rlabel file"><span class="tag">&nbsp;File</span></span>';
    let text = entry;
    if (this.config.trimext === true) {
      rlabel =
        `<span title="&nbsp;File: ${pEntry.base}" tooltip="${pEntry.base}" class="pi-rlabel file"><span class="tag">` +
        `&nbsp;File:</span> ${pEntry.base}</span>`;
      text = pEntry.name;
    }
    return {
      'displayText': stringUtils.unescapeStringQuote(text),
      'text': stringUtils.escapeStringQuote(text),
      'replacementPrefix': stringUtils.escapeStringQuote(prefix),
      'type': 'constant',
      'rightLabelHTML': rlabel,
      'description': path.join(searchPath, stringUtils.unescapeStringQuote(entry)),
      'iconHTML': '<i class="icon-file-code"></i>'
    };
  }

  /**
   * _formatDirectory - Format a file entry
   *
   * @param  {string} entry      unformatted directory entry.
   * @param  {string} prefix     Replacement prefix.
   * @param  {string} searchPath Base entry search path.
   * @return {object}            Formated entry.
   */
  _formatDirectory(entry, prefix, searchPath) {
    return {
      'displayText': stringUtils.unescapeStringQuote(entry),
      'text': stringUtils.escapeStringQuote(entry),
      'replacementPrefix': stringUtils.escapeStringQuote(prefix),
      'type': 'tag',
      'rightLabelHTML': '<span class="pi-rlabel file"><span class="tag">&nbsp;Directory</span></span>',
      'description': `${path.normalize(searchPath + '/' + stringUtils.unescapeStringQuote(entry))}`,
      'iconHTML': '<i class="icon-file-directory"></i>'
    };
  }
}

DefaultFormatter.id = 'DefaultFormatter';
module.exports = DefaultFormatter;
