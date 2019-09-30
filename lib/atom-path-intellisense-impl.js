'use babel'

import consts from './config/consts.js';
import BaseFormatter from './formatters/base.formatter.js';
import DefaultFormatter from './formatters/default.formatter.js';
import BasePathProvider from './providers/base-path.provider.js'
import CurrentFilePathProvider from './providers/current-file-path.provider.js';
import CurrentFileRelativePathProvider from './providers/current-file-relative-path.provider.js';
import NodeJSPathProvider from './providers/nodejs-path.provider.js';

/*TODO: Add configurable logging with enable /disable config option. Console and file transport @winston*/
export default class AtomPathIntellisenseImpl {
  constructor(package) {
    this.selector = "*";
    this.suggestionPriority = 1;
    this.inclusionPriority = 2;
    this.excludeLowerPriority = false;
    this.filterSuggestions = true;
    this._registerFormatters();
    this._registerPathProviders();
  }

  getSuggestions(req) {
    const self = this;
    var promize = new Promise((resolve, reject) => {
      const pathProvider = this._resolveBestPathProvider(req);
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

  deactivate() {
    this.pathProviders.forEach((p, i, arr) => {
      p.dispose();
      arr = arr.splice(i, 1);
      p = null;
    });
  }

  _registerFormatters() {
    console.log(`Registering formatters`);
    this.defaultFormatter = new DefaultFormatter();
    console.log(`Registered formatters`);
  }
  _registerPathProviders() {
    console.log(`Registering providers`);
    this.pathProviders = [];
    this.pathProviders.push(new CurrentFilePathProvider(this.defaultFormatter));
    this.pathProviders.push(new CurrentFileRelativePathProvider(this.defaultFormatter));
    // this.pathProviders.push(new NodeJSPathProvider(this.defaultFormatter));

    this.pathProviders.forEach(p => {
      atom.config.set(`${consts.PACKAGE_NAME}.${p.id}.activatedx010`, true, {scopeSelector: `${p.scopeSelector}`})
    });
    console.log(`Registered providers`);
  }
  _resolveBestPathProvider(req){
    const providers = this.pathProviders
    .filter(p => p instanceof BasePathProvider)
    // TODO filter by declared scopes
    .filter(p => {
      console.dir(req.scopeDescriptor);
      const valueAtCursor = atom.config.get(`${consts.PACKAGE_NAME}.${p.id}.activatedx010`, {scope: req.scopeDescriptor});
      console.dir(valueAtCursor);
      return valueAtCursor === true ? true : false;
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
