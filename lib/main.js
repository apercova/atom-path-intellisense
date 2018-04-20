'use babel';
var provider = require('./path-provider');

module.exports = {
  config:{
    "manual-suggest":{
      type: 'boolean',
      description:"If activated, path suggestions are provided only by typing ctrl + space shortcut.",
      default: false
    },
    "scope-descriptors":{
      type: "array",
      description:"Allowed scope descriptors to provide path suggestions.",
      default:[
        "string.quoted.single",
        "string.quoted.double"
      ]
    }
  },
  provide: function() {
    return provider;
  }
};
