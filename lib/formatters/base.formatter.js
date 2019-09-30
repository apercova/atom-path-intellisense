'use babel'

export default class BaseFormatter {
  constructor() {}
  format(rawSuggestions, req) {
    throw "Not implemented in base class!";
  }
}
