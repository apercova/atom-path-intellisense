'use babel'

module.exports = {
  "manual-suggest":{
    type: 'boolean',
    description:"If activated, path suggestions are provided only by typing ctrl + space shortcut.",
    default: false
  },
  "enforce-path": {
    type: 'boolean',
    description:"If activated, path suggestions are provided only by typing path starter patterns (/, ./, ../).",
    default: false
  },
  "scope-descriptors":{
    type: "array",
    description:"Allowed scope descriptors to provide path suggestions.",
    default:[
      "string",
      "text.plain"
    ]
  }
}
