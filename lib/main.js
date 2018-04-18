'use babel';
var provider = require('./path-provider');

module.exports = {
  provide: function() {
    return provider;
  }
};
