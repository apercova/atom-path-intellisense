'use babel'

import consts from './config/consts.js';
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
    // deprecated
    this.defaultFormatter = new DefaultFormatter();
    this.formatters = [];
    this.formatters.push(new DefaultFormatter());
    this.formatters.push(new NodeJSFormatter());
    console.log(`Registered formatters`);
  }
  _registerPathProviders() {
    const self = this;
    console.log(`Registering providers`);
    self.pathProviders = [];
    self.pathProviders.push(new CurrentFilePathProvider(self.defaultFormatter));
    self.pathProviders.push(new CurrentFileRelativePathProvider(self.defaultFormatter));
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
    })
    .finally(() => console.log('promise ended'));

    self.pathProviders.forEach(p => {
      atom.config.set(`${consts.PACKAGE_NAME}.${p.id}.activatedx011`, true, {scopeSelector: `${p.scopeSelector}`})
    });
    console.log(`Registered providers`);
    console.dir(self.pathProviders);
  }
  _resolveBestPathProvider(req){
    const providers = this.pathProviders
    .filter(p => p instanceof BasePathProvider)
    // TODO filter by declared scopes
    .filter(p => {
      console.dir(req.scopeDescriptor);
      const valueAtCursor = atom.config.get(`${consts.PACKAGE_NAME}.${p.id}.activatedx011`, {scope: req.scopeDescriptor});
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
