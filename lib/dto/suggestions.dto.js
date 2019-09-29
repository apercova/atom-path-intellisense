'use babel'

export default class SuggestionsDTO {
  constructor(prefix, suggestions){
    this.prefix = prefix || '';
    this.suggestions = suggestions || [];
  }
}
