'use babel'
const provider = require('./path-provider.js');

import settings from "./settings.js"
import consts from "./consts.js"
import config from "./config.js";
import DefaultPathProvider from "./path-provider.js"

let _provider;
//let _subscriptions = [];

export default {
  config: settings,
  activate () {
    console.log("activated");
  },
  getProvider(){
    return new DefaultPathProvider();;
  },
  deactivate() {
    console.log("deactivated");
    //this._subscriptions.forEach(subs => subs.dispose());
  }
}

/*
_observeSettings() {
  _subscriptions.push(atom.config.observe(`${consts.PACKAGE_NAME}`, (curr, prev) => {
      console.dir("!! CHANGED !!");
  }));
}
atom.config.observe(`${consts.PACKAGE_NAME}.${consts.CF_ALLOWED_SCOPES}`, (curr, prev) => {
    console.dir(this.selector);
    console.log(consts.CF_ALLOWED_SCOPES + "from => " + prev + " to => " + curr);
    this.selector = config.getAllowedScopes();
    console.dir(this.selector);
    cbk();
});
*/
