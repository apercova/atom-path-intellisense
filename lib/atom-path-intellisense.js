'use babel'
import consts from "./config/consts.js"
import settings from "./config/settings.js"
import config from "./config/config.js";
import DefaultPathProvider from "./path-provider.js";
import AtomPathIntellisenseImpl from "./atom-path-intellisense-impl.js";

class AtomPathIntellisense {

  constructor() {
    console.log('constructor');
    this.config = settings;
    this.impl = new AtomPathIntellisenseImpl(this);
    console.dir(this.impl);
  }
  getProvider() {
    return this.impl;
  }
  activate() {
    console.log("activating ...");
    this.impl.activate();
    console.log("activated");
  }
  deactivate() {
    console.log("deactivating ...");
    this.impl.deactivate();
    this.impl = null;
    console.log("deactivated");
  }
}

export default new AtomPathIntellisense();
