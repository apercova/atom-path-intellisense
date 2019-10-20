const consts = require('./config/consts');
const config = require('./config/config');
const settings = require('./config/settings');
const logger = require('./util/logger');
const AtomPathIntellisenseImpl = require('./atom-path-intellisense-impl');

class AtomPathIntellisense {
    constructor() {}
    initialize() {
        this._logger = logger.getLogger('AtomPathIntellisense');
        this.config = settings;
    }
    activate() {
        const self = this;
        self._logger.debug('Activating package.');
        this.impl = new AtomPathIntellisenseImpl(this);
        Promise.all([self.impl.activate(), self._registerConfObservers()])
            .then(() => {
                self._logger.debug('Package activated.');
            })
            .catch(e => {
                self._logger.debug('Error activating package.');
                throw e;
            });
    }
    deactivate() {
        this._logger.debug('Deactivating package.');
        const self = this;
        Promise.all([self.impl.dispose()])
            .then(() => {
                this._logger.debug('Package deactivated.');
            })
            .catch(e => {
                self._logger.warn('error deactivating package.');
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
    getProvider() {
        return this.impl;
    }
    _registerConfObservers() {
        const self = this;
        return new Promise((resolve, reject) => {
            try {
                config.addObserver(consts.CF_MANUAL_SUGGEST, () => {
                    if (config.isManualModeOn()) {
                        self._logger.debug('Manual suggestions: ON');
                    } else {
                        self._logger.debug('Manual suggestions: OFF');
                    }
                });
                config.addObserver(consts.CF_ENABLE_DEBUG, () => {
                    if (config.isDebugEnabled()) {
                        logger.enableDebug();
                        self._logger.debug('Debug mode: ON');
                    } else {
                        self._logger.debug('Debug mode: OFF');
                        logger.disableDebug();
                    }
                });
                config.addObserver(consts.CF_PROVIDER_STRATEGY_ALL, () => {
                    if (config.AllProvidersStrategyOn()) {
                        self._logger.debug('All providers strategy: ON');
                    } else {
                        self._logger.debug('All providers strategy: OFF');
                    }
                });

                config.addObserver(consts.CF_ALLOWED_SCOPES, () => {
                    self._logger.debug(
                        `Allowed scopes updated to: [${config.getAllowedScopes()}]`
                    );
                });

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }
}

module.exports = new AtomPathIntellisense();
