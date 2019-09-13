'use babel';

const settings = require('./config/settings.js');
const provider = require('./path-provider.js');

module.exports = {
  config: settings,
  provide: function() {
    return provider;
  }
};
