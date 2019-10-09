'use babel'

import consts from './config/consts.js';
import { anySelectorMatchAllScopes } from 'atom-selectors-plus';
import BaseFormatter from './formatters/base.formatter.js';
import DefaultFormatter from './formatters/default.formatter.js';
import BasePathProvider from './providers/base-path.provider.js'
import CurrentFilePathProvider from './providers/current-file-path.provider.js';
import CurrentFileRelativePathProvider from './providers/current-file-relative-path.provider.js';
import NodeJSPathProvider from './providers/nodejs-path.provider.js';
import NodeJSFormatter from './formatters/nodejs.formatter.js';

/*TODO: Add configurable logging with enable /disable config option. Console and file transport @winston*/
export default class AtomPathIntellisenseImpl {
  constructor(package) {
    this.selector = "*";
    this.suggestionPriority = 1;
    this.inclusionPriority = 2;
    this.excludeLowerPriority = false;
    this.filterSuggestions = true;
  }
  getSuggestions(req) {
    let suggestions = [];
    const bms = atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_MANUAL_SUGGEST}`);
    if(bms === true){
      if(req.activatedManually === true){
        console.log('Manually activated');
        suggestions = this._resolveSuggestions(req);
      }
    }else{
      console.log('Automatically activated');
      suggestions = this._resolveSuggestions(req);
    }
    return suggestions;
  }
  activate() {
    console.log("Activating auto-complete provider ...");
    this._registerFormatters();
    this._registerPathProviders();
    console.log("Auto-complete provider activated");
  }
  dispose() {
    console.log("Disposing auto-complete provider ...");
    this.pathProviders.forEach((p, i, arr) => {
      p.dispose();
      arr = arr.splice(i, 1);
      p = null;
    });
    console.log("Auto-complete provider disposed");
  }
  _resolveSuggestions(req) {
    const bpsAll = atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_PROVIDER_STRATEGY_ALL}`);
    if (bpsAll === true) {
      return this._resolveSuggestionsAcurracyAll(req);
    } else {
      return this._resolveSuggestionsAccuracyBest(req);
    }
  }
  _resolveSuggestionsAcurracyAll(req) {
    console.log('Using all providers strategy. Priority does not matter. ./');
    const self = this;
    var promize = new Promise((resolve, reject) => {
      const pathProviders = self._resolveAllPathProviders(req);
      if (pathProviders.length > 0) {
        console.dir(pathProviders);
        console.info(`Found ${pathProviders.length} providers`);
        Promise.all(pathProviders.map(p => p.resolve(req)))
        .then(function(values) {
          const suggestions = values.reduce((acum, val) => {
            let _val = val.filter(v => !acum.find(a => a.displayText === v.displayText));
            return acum.concat(_val);
          }, [])
          console.dir(suggestions);
          resolve(suggestions);
        })
        .catch(err => {
          console.error(err);
          reject(err);
        });
      } else {
        console.warn('No provider found');
      }
    });
    return promize;
  }
  _resolveSuggestionsAccuracyBest(req) {
    console.log('Using priority-based best provider strategy.');
    const self = this;
    var promize = new Promise((resolve, reject) => {
      const pathProvider = self._resolveBestPathProvider(req);
      if (pathProvider) {
        console.info('Best provider found');
        console.dir(pathProvider);
        pathProvider.resolve(req)
        .then(suggestions => {
          console.dir(suggestions);
          resolve(suggestions);
        })
        .catch(err => {
          console.error(err);
          reject(err);
        });
      } else {
        console.log('No provider found');
      }
    });
    return promize;
  }
  _registerFormatters() {
    console.log(`Registering formatters ...`);
    this.formatters = [];
    this.formatters.push(new DefaultFormatter());
    this.formatters.push(new NodeJSFormatter());
    console.log(`Formatters registered`);
  }
  _registerPathProviders() {
    const self = this;
    console.log(`Registering providers ...`);
    self.pathProviders = [];
    self.pathProviders.push(new CurrentFilePathProvider(this.formatters.find(f => f.id === 'DefaultFormatter')));
    self.pathProviders.push(new CurrentFileRelativePathProvider(this.formatters.find(f => f.id === 'DefaultFormatter')));
    const nodeJSPathProvider = new NodeJSPathProvider(this.formatters.find(f => f.id === 'NodeJSFormatter'));
    self.pathProviders.push(nodeJSPathProvider);
    nodeJSPathProvider.activate()
    .then(($self) => console.log(`NodeJSPathProvider activated`))
    .catch((err, $self) => {
      console.warn(err);
      self.pathProviders = self.pathProviders
      .filter(p => p.id !== $self.id);
      console.dir(self.pathProviders);
      console.warn('NodeJSPathProvider deactivated');
    });
    console.log(`Providers registered`);
    console.dir(self.pathProviders);
  }
  _resolveAllPathProviders(req){
    const scopesAtCursor = req.editor.getLastCursor().getScopeDescriptor().scopes;
    console.log(`scopesAtCursor: ${scopesAtCursor}`);
    const cfScopeSelector = atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_ALLOWED_SCOPES}`);
    console.log(`cfScopeSelector: ${cfScopeSelector}`);
    const providers = this.pathProviders
    .filter(p => {
      let result = p instanceof BasePathProvider
      ? (p.id === CurrentFilePathProvider.id || p.id === CurrentFileRelativePathProvider.id)
          ? anySelectorMatchAllScopes(cfScopeSelector || p.scopeSelector || '', scopesAtCursor)
          : anySelectorMatchAllScopes(p.scopeSelector || '', scopesAtCursor)
      : false;
      result = result && p.canResolve(req);
      return result;
    });
    return providers;
  }
  _resolveBestPathProvider(req){
    const scopesAtCursor = req.editor.getLastCursor().getScopeDescriptor().scopes;
    console.log(`scopesAtCursor: ${scopesAtCursor}`);
    const cfScopeSelector = atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_ALLOWED_SCOPES}`);
    console.log(`cfScopeSelector: ${cfScopeSelector}`);
    const providers = this.pathProviders
    .filter(p => {
      return p instanceof BasePathProvider
      ? (p.id === CurrentFilePathProvider.id || p.id === CurrentFileRelativePathProvider.id)
          ? anySelectorMatchAllScopes(cfScopeSelector || p.scopeSelector || '', scopesAtCursor)
          : anySelectorMatchAllScopes(p.scopeSelector || '', scopesAtCursor)
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
