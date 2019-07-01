'use babel';

const settings = require('./settings.js');
const provider = require('./path-provider.js');

module.exports = {
  config: settings,
  provide: function() {
    return provider;
  }
};
