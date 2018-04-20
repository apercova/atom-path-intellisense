'use babel';

var settings = require('./settings.js');
var provider = require('./path-provider');

module.exports = {
  config: settings,
  provide: function() {
    return provider;
  }
};
