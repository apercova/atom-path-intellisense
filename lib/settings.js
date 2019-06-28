'use babel'

module.exports = {
  "manual-suggest":{
    type: 'boolean',
    description:"If activated, path suggestions are provided only by typing ctrl + space shortcut.",
    default: false
  },
  "scope-descriptors":{
    type: "array",
    description:"Allowed scope descriptors to provide path suggestions.",
    default:[
      "source",
      "text.plain"
    ]
  }
}
