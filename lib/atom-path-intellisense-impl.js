import consts from "./config/consts.js";
import config from "./config/config.js";
//import CurrentFilePathProvider from './plugins/providers/current-file-path.provider.js';

export default class AtomPathIntellisenseImpl {
  constructor(package) {
    this.package = package;
    this._init();
  }
}
AtomPathIntellisenseImpl.prototype.getSuggestions = function(req){
  console.log('getSuggestions::');
  console.dir(this.pathProviders);
  var promize = new Promise((resolve, reject) => {
    resolve([]);
  });
  return promize;
};
AtomPathIntellisenseImpl.prototype.dispose = function(){
  this.pathProviders.foreach((p, c) => {
    p.dispose();
    //remove p from c
    p = null;
  });
}
AtomPathIntellisenseImpl.prototype._init = function(){
  this._loadConfig();
  this._registerPathProviders();
}
AtomPathIntellisenseImpl.prototype._loadConfig = function(){
  this.selector = '*';
  //this.selector = atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_ALLOWED_SCOPES}`);
  this.disableForSelector = config.getDisabledScopes()
  this.inclusionPriority = config.getInclusionPriority();
  this.excludeLowerPriority = config.excludeLowerPrioritySuggestions();
  this.suggestionPriority = config.getSuggestionPriority();
  this.filterSuggestions = config.filterSuggestions();
};
AtomPathIntellisenseImpl.prototype._registerPathProviders = function(provider){
  //this.pathProviders = [];
  //this.pathProviders.push({id: 'CurrentFilePathProvider', priority: 9999, provider: new CurrentFilePathProvider()});
}
