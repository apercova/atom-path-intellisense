'use strict';
const settings = require('./config/settings'),
  logger = require('./util/logger'),
  AtomPathIntellisenseImpl = require('./atom-path-intellisense-impl');

/**
 *
 * @class
 * @Classdesc Autocomplete provider implementation.
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
class AtomPathIntellisense {
  /**
   * @return {AtomPathIntellisense}  AtomPathIntellisense instance.
   */
  constructor() {
    this.config = settings;
  }

  /**
   * getProvider - Retrieves autocomplete-plus provider.
   *
   * @return {AtomPathIntellisenseImpl}  autocomplete-plus provider.
   */
  getProvider() {
    return this.impl;
  }

  /**
   * activate - Atom's package initialization hook.
   *
   * @return {void}
   */
  initialize() {
    this._logger = logger.getLogger('AtomPathIntellisense');
  }

  /**
   * activate - Atom's package activation hook.
   *
   * @return {void}
   */
  activate() {
    const self = this;
    self._logger.debug('Activating package.');
    this.impl = new AtomPathIntellisenseImpl(this);
    Promise.all([self.impl.activate()])
      .then(() => {
        self._logger.debug('Package activated.');
      })
      .catch(e => {
        self._logger.debug('Error activating package.');
        throw e;
      });
  }

  /**
   * deactivate - Atom's package deactivation hook.
   *
   * @return {void}
   */
  deactivate() {
    this._logger.debug('Deactivating package.');
    const self = this;
    Promise.all([self.impl.dispose()])
      .then(() => {})
      .catch(e => {
        self._logger.warn('Error deactivating package.');
        self._logger.warn(e);
      })
      .finally(() => {
        /* Disposing loggers */
        self._logger.debug('Disposing package loggers.');
        logger
          .dispose()
          .then(() => {})
          .catch(() => {});
      });
  }
}

module.exports = new AtomPathIntellisense();
