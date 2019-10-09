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
  }
  getProvider() {
    return this.impl;
  }
  activate() {
    console.log("Activating package ...");
    this.impl = new AtomPathIntellisenseImpl(this);
    console.dir(this.impl);
    this.impl.activate();
    console.log("Package activated");
  }
  deactivate() {
    console.log("Deactivating package ...");
    this.impl.dispose();
    this.impl = null;
    console.log("package deactivated");
  }
}

export default new AtomPathIntellisense();
