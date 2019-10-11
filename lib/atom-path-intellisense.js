const consts = require('./config/consts');
const config = require('./config/config');
const settings = require('./config/settings');
const logger = require('./util/logger');
const DefaultPathProvider = require('./path-provider');
const AtomPathIntellisenseImpl = require('./atom-path-intellisense-impl');

class AtomPathIntellisense {
  constructor() {
    this.config = settings;
    this._logger = logger.getLogger('AtomPathIntellisense');
  }
  getProvider() {
    return this.impl;
  }
  activate() {
    try {
      this._logger.debug("Activating package.");
      this.impl = new AtomPathIntellisenseImpl(this);
      this.impl.activate();
      this._registerConfObservers();
      this._logger.debug("Package activated");
    } catch(err) {
      this._logger.error(err);
      throw err;
    }
  }
  deactivate() {
    try {
      this._logger.debug("Deactivating package.");
      this.impl.dispose();
      this.impl = null;
      this._logger.debug("package deactivated.");
    } catch (err) {
      this._logger.error(err);
      throw err;
    }
    /* Disposing loggers */
    this._logger.debug("Disposing loggers.");
    logger.dispose();
  }
  _registerConfObservers() {
    const self = this;
    config.addObserver(consts.CF_ENABLE_DEBUG, (value) => {
      if (config.isDebugEnabled()) {
        logger.enableDebug();
        this._logger.debug('debug is enabled');
      } else {
        this._logger.debug('debug is disabled');
        logger.disableDebug()
      }
    });
  }
}

module.exports = new AtomPathIntellisense();
