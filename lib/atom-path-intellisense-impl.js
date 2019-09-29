'use babel'

import BaseFormatter from './plugins/formatters/base.formatter.js';
import DefaultFormatter from './plugins/formatters/default.formatter.js';
import BasePathProvider from './plugins/providers/base-path.provider.js'
import CurrentFilePathProvider from './plugins/providers/current-file-path.provider.js';
import CurrentFileRelativePathProvider from './plugins/providers/current-file-relative-path.provider.js';


export default class AtomPathIntellisenseImpl {
  constructor(package) {
    this.selector = "*";
    this.suggestionPriority = 1;
    this.inclusionPriority = 1;
    this.excludeLowerPriority = false;
    this.filterSuggestions = true;
    this._registerDefaultFormatter();
    this._registerPathProviders();
  }

  _formatSuggestions(req, rawSuggestions) {
    console.dir(rawSuggestions.suggestions);
    const formatter = this.formatter instanceof BaseFormatter
    ? this.formatter : this.defaultFormatter;
    return formatter.format(req, rawSuggestions);
  }
  getSuggestions(req) {
    const self = this;
    var promize = new Promise((resolve, reject) => {
      const pathProvider = this._resolveBestPathProvider(req);
      if (pathProvider) {
        pathProvider.resolve(req)
        .then(rawSuggestions => {
          console.dir(rawSuggestions);
          const fSuggestions = self._formatSuggestions(req, rawSuggestions);
          console.dir(fSuggestions);
          resolve(fSuggestions);
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

  _registerDefaultFormatter() {
    this.defaultFormatter = new DefaultFormatter();
    this.formatter = null;
  }
  _registerPathProviders() {
    this.pathProviders = [];
    this.pathProviders.push(new CurrentFilePathProvider());
    this.pathProviders.push(new CurrentFileRelativePathProvider());
  }
  _resolveBestPathProvider(req){
    const providers = this.pathProviders
    .filter(p => p instanceof BasePathProvider)
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
