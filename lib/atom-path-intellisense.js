'use babel'
import consts from "./config/consts.js"
import settings from "./config/settings.js"
import config from "./config/config.js";
import DefaultPathProvider from "./path-provider.js";
import AtomPathIntellisenseImpl from "./atom-path-intellisense-impl.js";

export default {
  config: settings,
  pathProviders: [],
  resolver: null,
  //impl : null,
  /*Resolve provider*/
  getProvider(){
    //console.dir(this.resolver);
    //return new DefaultPathProvider(this);
    //return this.impl;
    return {};
  },
  activate () {
    //this.impl = new AtomPathIntellisenseImpl(this);
    // Register suggestion resolverinstance
    //load providers by scope
    //atom.config.set("atom-path-intellisense.pattern", "(.*)", {scopeSelector: '.source .string'});
    //this.resolver = new DefaultPathProvider(this);
    console.log("activated");
  },
  deactivate() {
    console.log("deactivated");
    //this._subscriptions.forEach(subs => subs.dispose());
  }
}
