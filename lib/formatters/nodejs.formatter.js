'use babel';

import path from 'path';
import stringUtils from '../util/string-utils.js';
import BaseFormatter from './base.formatter.js';
import SuggestionsDTO from '../dto/suggestions.dto.js';

/**
 * Default formatter class
 * @author {@literal @}apercova
 * <a href="https://github.com/apercova" target="_blank">https://github.com/apercova</a>
 * <a href="https://twitter.com/apercova" target="_blank">{@literal @}apercova</a>
 * @since 1.2.0
 */
export default class NodeJSFormatter extends BaseFormatter{
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
  format(rawSuggestions, req) {
    console.dir(rawSuggestions);
    let fSuggestions = [];
    if (rawSuggestions instanceof SuggestionsDTO && Array.isArray(rawSuggestions.suggestions)) {
      rawSuggestions.suggestions.forEach(raw => {
        let pathType = rawSuggestions.testPath.startsWith('.') ? 'local' : 'lmodule';
        if(raw.type === 'dir'){
          fSuggestions.push(this._formatDirectory(`${raw.entry}`, rawSuggestions.prefix, rawSuggestions.searchPath, pathType));
        }
        if(raw.type === 'file'){
          fSuggestions.push(this._formatFile(raw.entry, rawSuggestions.prefix, rawSuggestions.searchPath, pathType));
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
  _formatFile(entry, prefix, searchPath, pathType) {
    const pEntry = path.parse(entry);
    const source = pathType === 'local' ? 'local module' : 'nodejs module';
    return {
      displayText: stringUtils.unescapeStringQuote(pEntry.name),
      text: stringUtils.escapeStringQuote(pEntry.name),
      replacementPrefix: stringUtils.escapeStringQuote(prefix),
      type: "constant",
      rightLabelHTML: `<span title="&nbsp;${source} :: File { ${pEntry.base} }" class="pi-rlabel file">&nbsp;${source} :: File { ${pEntry.base} }</span>`,
      description: `${path.normalize(searchPath + '/' + stringUtils.unescapeStringQuote(entry))}`,
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
  _formatDirectory(entry, prefix, searchPath, pathType) {
    const source = pathType === 'local' ? 'local module' : 'nodejs module';
    return {
      displayText: stringUtils.unescapeStringQuote(entry),
      text: stringUtils.escapeStringQuote(entry),
      replacementPrefix: stringUtils.escapeStringQuote(prefix),
      type: "tag",
      rightLabelHTML: `<span title="&nbsp;${source} :: Directory" class="pi-rlabel file">&nbsp;${source} :: Directory</span>`,
      description: `${path.normalize(searchPath + '/' + stringUtils.unescapeStringQuote(entry))}`,
      iconHTML: '<i class="icon-package"></i>'
    };
  }
}

NodeJSFormatter.id = 'NodeJSFormatter';
