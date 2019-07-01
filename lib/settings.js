'use babel'

module.exports = {
  "manual-suggest":{
    type: 'boolean',
    description:"If activated, path autocomplete suggestions are provided only by user request (e.g. with ctrl+space shortcut).",
    default: false
  },
  "order-by-type":{
    type: 'boolean',
    description:"If activated, default files natural order is replaced by file-type based order.",
    default: false
  },
  "show-real-path":{
    type: 'boolean',
    description:"If activated, real file/dir path is shown as description.",
    default: false
  }
}

/*module.exports = {
  "manual-suggest":{
    type: 'boolean',
    description:"If activated, path suggestions are provided only by typing (ctrl + space) shortcut.",
    default: false
  },
  "enforce-path": {
    type: 'boolean',
    description:"If activated, path suggestions are provided only by typing path starter patterns: '/', './', '../').",
    default: true
  },
  "scope-descriptors":{
    type: "array",
    description:"Allowed scope descriptors to provide path suggestions.",
    default:[
      ".source .string",
      "text.plain"
    ]
  }
}
*/
