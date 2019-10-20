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
    const self = this;
    self._logger.debug("Activating package.");
    this.impl = new AtomPathIntellisenseImpl(this);
    Promise.all([
      self.impl.activate(),
      self._registerConfObservers()
    ])
    .then(values =>{
        self._logger.debug("Package activated.");
    })
    .catch(e => {
      self._logger.debug("Error activating package.");
      throw e;
    });
  }
  deactivate() {
    this._logger.debug("Deactivating package.");
    console.dir(this.impl.dispose());

    /*self.impl.dispose()
    .then(values => {
      self._logger.debug("Package deactivated.");
    })
    .catch(e => {
      self._logger.warn("Cannot deactivate package.");
      self._logger.warn(e);
    })*/
  }
  deactivateBAK() {
    const self = this;
    self._logger.debug("Deactivating package.");
    Promise.all([
      self.impl.dispose()
    ])
    .then(values =>{
      self._logger.debug("Package deactivated.");

      /* Disposing loggers */
      /*self._logger.debug("Disposing loggers.");
      logger.dispose()
      .then(() => {
        console.log("Package deactivated.");
      })
      .catch(e => {
        console.warn("Cannot dispose loggers.");
        console.warn(e);
      });*/

    })
    .catch(e => {
      self._logger.warn("Cannot deactivate package.");
      self._logger.warn(e);
    });
    /*try {
      this._logger.debug("Deactivating package.");
      this.impl.dispose();
      this.impl = null;
      this._logger.debug("package deactivated.");
    } catch (err) {
      this._logger.error(err);
      throw err;
    }*/
    /* Disposing loggers */
    /*this._logger.debug("Disposing loggers.");
    logger.dispose();*/
  }
  _registerConfObservers() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        config.addObserver(consts.CF_ENABLE_DEBUG, (value) => {
          if (config.isDebugEnabled()) {
            logger.enableDebug();
            self._logger.debug('debug is enabled');
          } else {
            self._logger.debug('debug is disabled');
            logger.disableDebug()
          }
        });
        resolve();
      } catch (e) {
        reject(e);
      }
    })

  }
}

module.exports = new AtomPathIntellisense();
