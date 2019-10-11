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
      this._logger.debug("Activating auto-complete provider.");
      this._registerFormatters();
      this._registerPathProviders();
      this._logger.debug("Auto-complete provider activated.");
  }
  dispose() {
    this._logger.debug("Disposing auto-complete provider.");
    this.pathProviders.forEach((p, ind, arr) => {
      p.dispose();
    });
    this.pathProviders = null;
    this._logger.debug("Auto-complete provider disposed.");
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
    this._logger.debug('Using all providers strategy. Priority does not matter.');
    let suggestions = Promise.resolve([]);
    const pathProviders = self._resolveAllPathProviders(req);
    if (pathProviders.length > 0) {
      self._logger.debug(pathProviders.map(p => p.id).join('|'));
      self._logger.debug(`Found ${pathProviders.length} providers`);
      Promise.all(pathProviders.map(p => p.resolve(req)))
      .then(function(values) {
        const _suggestions = values.reduce((acum, val) => {
          let _val = val.filter(v => !acum.find(a => a.displayText === v.displayText));
          return acum.concat(_val);
        }, []);
        suggestions = Promise.resolve(_suggestions);
      })
      .catch(err => {
        self._logger.warn(err);
      });
    } else {
      self._logger.debug('No provider found');
    }
    return suggestions;
  }
  _resolveSuggestionsAccuracyBest(req) {
    this._logger.debug('Using priority-based best provider strategy.');
    let suggestions = Promise.resolve([]);
    const pathProvider = this._resolveBestPathProvider(req);
    if (pathProvider) {
      this._logger.debug(`Best provider found: ${pathProvider.id}`);
      suggestions = pathProvider.resolve(req);
    } else {
      this._logger.debug('No provider found.');
    }
    return suggestions;
  }
  _registerFormatters() {
    this._logger.debug(`Registering formatters.`);
    this.formatters = [];
    this.formatters.push(new DefaultFormatter());
    this.formatters.push(new NodeJSFormatter());
    this._logger.debug(`Formatters registered.`);
  }
  _registerPathProviders() {
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
    self._logger.debug(self.pathProviders);
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
}

module.exports = AtomPathIntellisenseImpl;
