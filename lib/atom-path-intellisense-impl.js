'use strict';
const consts = require('./config/consts'),
  config = require('./config/config'),
  selectors = require('atom-selectors-plus'),
  logger = require('./util/logger'),
  BasePathProvider = require('./providers/base-path.provider'),
  CurrentFilePathProvider = require('./providers/current-file-path.provider'),
  CurrentFileRelativePathProvider = require('./providers/current-file-relative-path.provider'),
  NodeJSPathProvider = require('./providers/nodejs-path.provider');

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
class AtomPathIntellisenseImpl {
  /**
   * @return {AtomPathIntellisenseImpl}  AtomPathIntellisenseImpl instance.
   */
  constructor() {
    this._logger = logger.getLogger('AtomPathIntellisenseImpl');
    this.selector = '*';
    this.suggestionPriority = 1;
    this.inclusionPriority = 2;
    this.excludeLowerPriority = false;
    this.filterSuggestions = true;
    this._subscriptions = [];
  }

  /**
   * getSuggestions - resolve suggestions using registered path providers.
   *
   * @param  {object} req Request options.
   * @return {Promise} Promise for resolving path suggestions.
   */
  getSuggestions(req) {
    let suggestions = [];
    const manualMode = config.isManualModeOn();
    if (manualMode === true) {
      if (req.activatedManually === true) {
        this._logger.debug('Manually activated.');
        suggestions = this._resolveSuggestions(req);
      }
    } else {
      this._logger.debug('Automatically activated.');
      suggestions = this._resolveSuggestions(req);
    }
    return suggestions;
  }

  /**
   * activate - Autocomplete-plus provider activation hook.
   *
   * @return {void}
   */
  activate() {
    const self = this;
    self._logger.debug('Activating auto-complete provider.');
    return new Promise((resolve, reject) => {
      self._logger.debug('Registering configuration observers.');
      self
        ._registerConfObservers()
        .then(() => {
          self
            ._registerPathProviders()
            .then(() => {
              self._logger.debug('Auto-complete provider activated.');
              resolve(true);
            })
            .catch(e => {
              self._logger.error('Error registering path providers.');
              reject(e);
            });
        })
        .catch(e => {
          self._logger.error('Error registering configuration observers.');
          reject(e);
        });
    });
  }

  /**
   * dispose - Autocomplete-plus provider disposition hook.
   *
   * @return {void}
   */
  dispose() {
    const self = this;
    return new Promise((resolve, reject) => {
      Promise.all([self._disposePathProviders()])
        .then(() => {
          self._logger.debug('Disposing subscriptions.');
          self._subscriptions.forEach(s => s.dispose());
          self._logger.debug('Subscriptions disposed.');
        })
        .catch(e => reject(e));
    });
  }

  /**
   * _resolveSuggestions - facade to resolve suggestions based on enabled strategy.
   *
   * @param  {object} req Request options.
   * @return {Promise} Promise for resolving path suggestions.
   */
  _resolveSuggestions(req) {
    const bpsAll = config.AllProvidersStrategyOn();
    if (bpsAll === true) {
      return this._resolveSuggestionsAcurracyAll(req);
    } else {
      return this._resolveSuggestionsAccuracyBest(req);
    }
  }

  /**
   * _resolveSuggestionsAcurracyAll - Resolves suggestions based on All-Provider strategy.
   * Uses all suited providers that can resolve suggestions for a given context.
   * Filters provider scope selectors.
   * Does not use provider priority.
   *
   * @param  {type}    req Request options.
   * @return {Promise}     Promise for resolving path suggestions.
   */
  _resolveSuggestionsAcurracyAll(req) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        self._logger.debug('Using all providers strategy. Priority does not matter.');
        const pathProviders = self._resolveAllPathProviders(req);
        if (pathProviders.length > 0) {
          Promise.all(pathProviders.map(p => p.resolve(req)))
            .then(values => {
              const _suggestions = values.reduce((acum, val) => {
                let _val = val.filter(v => !acum.find(a => a.displayText === v.displayText));
                return acum.concat(_val);
              }, []);
              resolve(_suggestions);
            })
            .catch(e => reject(e));
        } else {
          this._logger.debug('No provider found');
          resolve([]);
        }
      } catch (e) {
        self._logger.error('Error using all providers strategy.');
        reject(e);
      }
    });
  }

  /**
   * _resolveSuggestionsAccuracyBest - Resolves suggestions based on Best-Provider strategy.
   * Search for best suited provider taht can resolve suggestions for a given context based
   * on provider priority.
   * Filters provider scope selectors.
   *
   * @param  {type}    req Request options.
   * @return {Promise}     Promise for resolving path suggestions.
   */
  _resolveSuggestionsAccuracyBest(req) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        self._logger.debug('Using priority-based best provider strategy.');
        const pathProvider = this._resolveBestPathProvider(req);
        if (pathProvider) {
          self._logger.debug(`Best provider found: ${pathProvider.id}`);
          pathProvider
            .resolve(req)
            .then(suggestions => resolve(suggestions))
            .catch(e => reject(e));
        } else {
          self._logger.debug('No provider found.');
          resolve([]);
        }
      } catch (e) {
        self._logger.error('Error using priority-based best provider strategy.');
        reject(e);
      }
    });
  }

  /**
   * _registerPathProviders - Register path providers.
   *
   * @return {void}
   */
  _registerPathProviders() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        self._logger.debug('Registering path providers.');
        self.pathProviders = [];
        self.pathProviders.push(new CurrentFilePathProvider());
        self.pathProviders.push(new CurrentFileRelativePathProvider());
        self.pathProviders.push(new NodeJSPathProvider());
        self._logger.debug(`${self.pathProviders.length} path providers registered`);

        self._logger.debug('Activating path providers.');
        Promise.all(self.pathProviders.map(p => p.activate()))
          .then(() => {
            self._logger.debug('Providers activated.');
            self._logger.debug('Providers registered.');
            resolve(self.pathProviders);
          })
          .catch(e => {
            self._logger.error('Error activating providers.');
            let _e = (e || {}).error;
            let _provider = (e || {}).provider;
            if (_e) {
              self._logger.error(`Error msg: ${_e}`);
            }
            if (_provider) {
              self._logger.debug(`Deactivating provider ${_provider.id}.`);
              self.pathProviders = self.pathProviders.filter(p => p.id !== _provider.id);
              self._logger.debug(`Provider ${_provider.id} deactivated.`);
            }
            resolve(self.pathProviders);
          });
      } catch (e) {
        self._logger.debug('Error registering providers.');
        reject(e);
      }
    });
  }

  /**
   * _providerFilter - Filter function for valid providers.
   *
   * @param  {object} req Request options
   * @return {Array}      Array containing filtered valid rpoviders.
   */
  _providerFilter(req) {
    const scopesAtCursor = req.editor.getLastCursor().getScopeDescriptor().scopes;
    this._logger.debug(`scopesAtCursor: ${scopesAtCursor}`);
    const cfScopeSelector = atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_ALLOWED_SCOPES}`);
    this._logger.debug(`cfScopeSelector: ${cfScopeSelector}`);
    return p => {
      let result =
        p instanceof BasePathProvider
          ? p.id === CurrentFileRelativePathProvider.id
            ? selectors.anySelectorMatchAllScopes(cfScopeSelector || p.scopeSelector || '', scopesAtCursor)
            : selectors.anySelectorMatchAllScopes(p.scopeSelector || '', scopesAtCursor)
          : false;
      result = result && p.canResolve(req);
      return result;
    };
  }

  /**
   * _resolveAllPathProviders - Resolve all path providers that can resolve
   * suggestions for a given context.
   *
   * @param  {object} req Request options.
   * @return {Array}      Providers.
   */
  _resolveAllPathProviders(req) {
    const providers = this.pathProviders.filter(this._providerFilter(req));
    return providers;
  }

  /**
   * _resolveBestPathProvider - Resolve bes suited path provider taht can
   * resolve suggestions for a given path.
   *
   * @param  {object}           req Request options.
   * @return {BasePathProvider}     Provider.
   */
  _resolveBestPathProvider(req) {
    /*Filter providers by scope*/
    const providers = this.pathProviders.filter(this._providerFilter(req)).sort((a, b) => a.priority - b.priority);
    let provider = null;
    providers.some(p => {
      if (p.canResolve(req)) {
        provider = p;
        return true;
      }
      return false;
    });
    return provider;
  }

  /**
   * _disposePathProviders - Dispose registered path providers.
   *
   * @return {void}
   */
  _disposePathProviders() {
    const self = this;
    return new Promise((resolve, reject) => {
      Promise.all(self.pathProviders.map(p => p.dispose()))
        .then(providers => {
          self._logger.debug(`${providers.length} providers disposed.`);
          providers.forEach(_provider => {
            self._logger.debug(`Provider ${_provider.id} disposed.`);
          });
          resolve(self.pathProviders);
        })
        .catch(e => {
          let _e = (e || {}).error;
          let _provider = (e || {}).provider;
          self._logger.error(`Error disposing provider(s). ${_provider}`);
          self._logger.error(_e);
          reject(_e);
        });
    });
  }

  /**
   * _registerConfObservers - Register configuration observers.
   *
   * @return {void}
   */
  _registerConfObservers() {
    const self = this;
    return new Promise(resolve => {
      self._subscriptions.push(
        config.addObserver(consts.CF_MANUAL_SUGGEST, () => {
          if (config.isManualModeOn()) {
            self._logger.debug('Manual suggestions: ON');
          } else {
            self._logger.debug('Manual suggestions: OFF');
          }
        })
      );
      self._subscriptions.push(
        config.addObserver(consts.CF_ENABLE_DEBUG, () => {
          if (config.isDebugEnabled()) {
            logger.enableDebug();
            self._logger.debug('Debug mode: ON');
          } else {
            self._logger.debug('Debug mode: OFF');
            logger.enableError();
          }
        })
      );
      self._subscriptions.push(
        config.addObserver(consts.CF_PROVIDER_STRATEGY_ALL, () => {
          if (config.AllProvidersStrategyOn()) {
            self._logger.debug('All providers strategy: ON');
          } else {
            self._logger.debug('All providers strategy: OFF');
          }
        })
      );
      self._subscriptions.push(
        config.addObserver(consts.CF_ALLOWED_SCOPES, () => {
          self._logger.debug(`Allowed scopes updated to: [${config.getAllowedScopes()}]`);
        })
      );

      resolve(self._subscriptions);
    });
  }
}

module.exports = AtomPathIntellisenseImpl;
