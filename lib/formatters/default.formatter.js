'use babel';

import stringUtils from '../util/string-utils.js';
import BaseFormatter from './base.formatter.js';
import SuggestionsDTO from '../dto/suggestions.dto.js';

export default class DefaultFormatter extends BaseFormatter{
  constructor() {
    super();
  }

  format(req, rawSuggestions) {

    const fSuggestions = [];
    if (rawSuggestions instanceof SuggestionsDTO && Array.isArray(rawSuggestions.suggestions)) {

      rawSuggestions.suggestions.forEach(raw => {
        if(raw.type === 'dir'){
          fSuggestions.push(this.formatDirectory(`${raw.entry}/`, rawSuggestions.prefix));
        }
        if(raw.type === 'file'){
          fSuggestions.push(this.formatFile(raw.entry, rawSuggestions.prefix));
        }
      });
    }
    return fSuggestions;
  }
  formatFile(entry, prefix) {
    return {
      displayText:stringUtils.unescapeStringQuote(entry),
      text:stringUtils.escapeStringQuote(entry),
      replacementPrefix: stringUtils.escapeStringQuote(prefix),
      type:"tag",
      leftLabelHTML:'<span class="pi-rlabel file">File</span>'
    };
  }
  formatDirectory(entry, prefix) {
    return {
      displayText: stringUtils.unescapeStringQuote(entry),
      text: stringUtils.escapeStringQuote(entry),
      replacementPrefix: stringUtils.escapeStringQuote(prefix),
      type:"tag",
      leftLabelHTML:'<span class="pi-rlabel directory">Directory</span>'
    };
  }
}
