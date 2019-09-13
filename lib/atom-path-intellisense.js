'use babel'
import consts from "./config/consts.js"
import settings from "./config/settings.js"
import config from "./config/config.js";
import DefaultPathProvider from "./path-provider.js"

export default {
  config: settings,
  activate () {
    console.log("activated");
    atom.config.set("atom-path-intellisense.pattern", "(.*)", {scopeSelector: '.source .string'});
  },
  getProvider(){
    return new DefaultPathProvider();;
  },
  deactivate() {
    console.log("deactivated");
    //this._subscriptions.forEach(subs => subs.dispose());
  }
}
