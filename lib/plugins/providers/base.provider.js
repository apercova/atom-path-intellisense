'use babel'

export class BaseProvider {


  resolvePath (cpos, cline) {
    return false;
  }

  resolveSuggestions(suggestionfactory) {
    return [];
  }

}
