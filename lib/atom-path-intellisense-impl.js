const consts = require('./config/consts');
const config = require('./config/config');
const selectors = require('atom-selectors-plus');
const logger = require('./util/logger');
const BaseFormatter = require('./formatters/base.formatter');
const DefaultFormatter = require('./formatters/default.formatter');
const BasePathProvider = require('./providers/base-path.provider');
const CurrentFilePathProvider = require('./providers/current-file-path.provider');
const CurrentFileRelativePathProvider = require('./providers/current-file-relative-path.provider');
const NodeJSPathProvider = require('./providers/nodejs-path.provider');
const NodeJSFormatter = require('./formatters/nodejs.formatter');

class AtomPathIntellisenseImpl {
  constructor(pkgref) {
    this._logger = logger.getLogger('AtomPathIntellisenseImpl');
    this.selector = "*";
    this.suggestionPriority = 1;
    this.inclusionPriority = 2;
    this.excludeLowerPriority = false;
    this.filterSuggestions = true;
  }
  getSuggestions(req) {
    const self = this;
    let suggestions = [];
    const manualMode = config.isManualModeOn();
    if(manualMode === true){
      if(req.activatedManually === true){
        this._logger.debug('Manually activated.');
        suggestions = this._resolveSuggestions(req);
      }
    }else{
      this._logger.debug('Automatically activated.');
      suggestions = this._resolveSuggestions(req);
    }
    return suggestions;
  }
  activate() {
    const self = this;
    self._logger.debug("Activating auto-complete provider.");
    return new Promise((resolve, reject) => {
      self._registerFormatters()
      .then(formatters => {
        self._registerPathProviders()
        .then(providers => {
          self._logger.debug("Auto-complete provider activated.");
          resolve(true);
        })
        .catch(e => {
          self._logger.error("Error activating auto-complete provider.");
          reject(e);
        })
      })
      .catch(e => {
        self._logger.error("Error activating auto-complete provider.");
        reject(e);
      });
    });
  }
  dispose() {
    const self = this;
    return Promise.all([
      self._disposePathProviders()
    ]);
  }

  _resolveSuggestions(req) {
    const bpsAll = config.AllProvidersStrategyOn();
    if (bpsAll === true) {
      return this._resolveSuggestionsAcurracyAll(req);
    } else {
      return this._resolveSuggestionsAccuracyBest(req);
    }
  }
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
  _resolveSuggestionsAccuracyBest(req) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        self._logger.debug('Using priority-based best provider strategy.');
        const pathProvider = this._resolveBestPathProvider(req);
        if (pathProvider) {
          self._logger.debug(`Best provider found: ${pathProvider.id}`);
          pathProvider.resolve(req)
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
  _registerFormatters() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        self._logger.debug(`Registering formatters.`);
        self.formatters = [];
        self.formatters.push(new DefaultFormatter());
        self.formatters.push(new NodeJSFormatter());
        self._logger.debug(`Formatters registered.`);
        resolve(self.formatters);
      } catch (e) {
        self._logger.error(`Error at registering formatters.`);
        reject(e);
      }
    });
  }
  _registerPathProviders() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        self._logger.debug(`Registering providers.`);
        self.pathProviders = [];
        self.pathProviders.push(new CurrentFilePathProvider(this.formatters.find(f => f.id === 'DefaultFormatter')));
        self.pathProviders.push(new CurrentFileRelativePathProvider(this.formatters.find(f => f.id === 'DefaultFormatter')));
        self.pathProviders.push(new NodeJSPathProvider(this.formatters.find(f => f.id === 'NodeJSFormatter')))

        self._logger.debug(`Activating providers.`);
        Promise.all(self.pathProviders.map(p => p.activate()))
        .then(function(values) {
          self._logger.debug(`Providers activated.`);
          self._logger.debug(`Providers registered.`);
          resolve(self.pathProviders);
        })
        .catch((e) => {
          self._logger.error(`Error activating providers.`);
          let _e = (e ||{}).error;
          let _provider = (e ||{}).provider;
          if (_e) {
            self._logger.error(`Error msg: ${_e}`);
          }
          if (_provider) {
            self._logger.debug(`Deactivating provider ${_provider.id}.`);
            self.pathProviders = self.pathProviders
            .filter(p => p.id !== _provider.id);
            self._logger.debug(`Provider ${_provider.id} deactivated.`);
          }
          resolve(self.pathProviders);
        });
      } catch (e) {
        self._logger.debug(`Error registering providers.`);
        reject(e);
      }
    });
  }
  _registerPathProvidersBAK() {
    const self = this;
    self._logger.debug(`Registering providers.`);
    self.pathProviders = [];
    self.pathProviders.push(new CurrentFilePathProvider(this.formatters.find(f => f.id === 'DefaultFormatter')));
    self.pathProviders.push(new CurrentFileRelativePathProvider(this.formatters.find(f => f.id === 'DefaultFormatter')));
    const nodeJSPathProvider = new NodeJSPathProvider(this.formatters.find(f => f.id === 'NodeJSFormatter'));
    self.pathProviders.push(nodeJSPathProvider);
    nodeJSPathProvider.activate()
    .then(($self) => self._logger.debug(`NodeJSPathProvider activated.`))
    .catch((err, $self) => {
      self._logger.warn(err);
      self.pathProviders = self.pathProviders
      .filter(p => p.id !== $self.id);
      self._logger.debug(self.pathProviders);
      self._logger.debug('NodeJSPathProvider deactivated.');
    });
    self._logger.debug(`Providers registered.`);
  }
  _resolveAllPathProviders(req){
    const scopesAtCursor = req.editor.getLastCursor().getScopeDescriptor().scopes;
    this._logger.debug(`scopesAtCursor: ${scopesAtCursor}`);
    const cfScopeSelector = atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_ALLOWED_SCOPES}`);
    this._logger.debug(`cfScopeSelector: ${cfScopeSelector}`);
    const providers = this.pathProviders
    .filter(p => {
      let result = p instanceof BasePathProvider
      ? (p.id === CurrentFilePathProvider.id || p.id === CurrentFileRelativePathProvider.id)
          ? selectors.anySelectorMatchAllScopes(cfScopeSelector || p.scopeSelector || '', scopesAtCursor)
          : selectors.anySelectorMatchAllScopes(p.scopeSelector || '', scopesAtCursor)
      : false;
      result = result && p.canResolve(req);
      return result;
    });
    return providers;
  }
  _resolveBestPathProvider(req){
    const scopesAtCursor = req.editor.getLastCursor().getScopeDescriptor().scopes;
    this._logger.debug(`scopesAtCursor: ${scopesAtCursor}`);
    const cfScopeSelector = atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_ALLOWED_SCOPES}`);
    this._logger.debug(`cfScopeSelector: ${cfScopeSelector}`);
    const providers = this.pathProviders
    .filter(p => {
      return p instanceof BasePathProvider
      ? (p.id === CurrentFilePathProvider.id || p.id === CurrentFileRelativePathProvider.id)
          ? selectors.anySelectorMatchAllScopes(cfScopeSelector || p.scopeSelector || '', scopesAtCursor)
          : selectors.anySelectorMatchAllScopes(p.scopeSelector || '', scopesAtCursor)
      : false;
    })
    .sort((a, b) => a.priority - b.priority);

    let provider = null;
    providers.some(p => {
      if (p.canResolve(req)) {
        provider = p;
        return true;
      }
    });
    return provider;
  }
  _disposePathProviders() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        Promise.all(self.pathProviders.map(p => p.dispose()))
        .then(providers => {
          self._logger.debug(`${providers.length} providers disposed.`);
          providers.forEach(_provider => {
            self._logger.debug(`Provider ${_provider.id} disposed.`);
          });
          resolve(self.pathProviders);
        })
        .catch(e => {
          self._logger.error(`Error disposing providers.`);
          let _e = (e ||{}).error;
          let _provider = (e ||{}).provider;
          if (_e) {
            self._logger.error(`Error msg: ${_e}`);
          }
          if (_provider) {
            self._logger.warn(`Provider ${_provider.id} not disposed.`);
          }
          resolve(self.pathProviders);
        });
      } catch (e) {
        self._logger.debug(`Error disposing providers22.`);
        reject(e);
      }
    });
  }
}

module.exports = AtomPathIntellisenseImpl;
