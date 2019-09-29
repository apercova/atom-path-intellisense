'use babel'

export default class BaseFormatter {
  constructor() {}
  format(req, rawSuggestions) {
    throw "Not implemented in base class!";
  }
}
