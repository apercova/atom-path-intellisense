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
    this._registerFormatters();
    this._registerPathProviders();
  }
  deactivate() {
    this.pathProviders.forEach((p, i, arr) => {
      p.dispose();
      arr = arr.splice(i, 1);
      p = null;
    });
  }
  _resolveSuggestions(req) {
    const self = this;
    var promize = new Promise((resolve, reject) => {
      const pathProvider = self._resolveBestPathProvider(req);
      if (pathProvider instanceof BasePathProvider) {
        pathProvider.resolve(req)
        .then(suggestions => {
          console.dir(suggestions);
          resolve(suggestions);
        })
        .catch(err => {
          throw new Error(err);
        });
      } else {
        resolve([]);
      }
    });
    return promize;
  }
  _registerFormatters() {
    console.log(`Registering formatters`);
    this.formatters = [];
    this.formatters.push(new DefaultFormatter());
    this.formatters.push(new NodeJSFormatter());
    console.log(`Registered formatters`);
  }
  _registerPathProviders() {
    const self = this;
    console.log(`Registering providers`);
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
    console.log(`Registered providers`);
    console.dir(self.pathProviders);
  }
  _resolveBestPathProvider(req){
    const scopesAtCursor = req.editor.getLastCursor().getScopeDescriptor().scopes;
    console.log(`scopesAtCursor: ${scopesAtCursor}`);
    const cfScopeSelector = atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_ALLOWED_SCOPES}`);
    console.log(`cfScopeSelector: ${cfScopeSelector}`);
    const providers = this.pathProviders
    /*.filter(p => p instanceof BasePathProvider)
    .filter(p => { //filter by declared scopes
      if (p.id === CurrentFilePathProvider.id || p.id === CurrentFileRelativePathProvider.id) {
        return anySelectorMatchAllScopes(cfScopeSelector || p.scopeSelector || '', scopesAtCursor);
      } else {
        return anySelectorMatchAllScopes(p.scopeSelector || '', scopesAtCursor);
      }
    })*/
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

    if (provider instanceof BasePathProvider) {
      console.info('Best provider found');
      console.dir(provider);
    } else {
      console.warn('No provider found');
    }
    return provider;
  }
}
