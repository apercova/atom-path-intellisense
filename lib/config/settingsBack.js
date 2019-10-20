const consts = require('./consts');
const settings = {};
settings[`${consts.CF_MANUAL_SUGGEST}`] = {
    type: 'boolean',
    description:
        'If activated, path autocomplete suggestions are provided only by user request (e.g. with ctrl+space shortcut).',
    default: false
};
settings[`${consts.CF_ALLOWED_SCOPES}`] = {
    type: 'string',
    description:
        'Defines the scope selector(s) (can be comma-separated) for which suggestions should be given.',
    default: '.source .string.quoted, .text'
};
settings[`${consts.CF_DISABLED_SCOPES}`] = {
    type: 'string',
    description:
        '(optional): Defines the scope selector(s) (can be comma-separated) for which suggestions should not be given.',
    default: ''
};
settings[`${consts.CF_SG_PRIORITY}`] = {
    type: 'integer',
    description:
        'Suggestion priority level among other providers. Default provider has an inclusionPriority of 1.',
    default: 2
};
settings[`${consts.CF_INC_PRIORITY}`] = {
    type: 'integer',
    description:
        'Inclusion priority level among other providers. Default provider has an inclusionPriority of 0.',
    default: 1
};
settings[`${consts.CF_EX_LOW_PRIORITY}`] = {
    type: 'boolean',
    description:
        'If activated, will suppress any providers with a lower priority.',
    default: false
};
settings[`${consts.CF_SG_FILTER}`] = {
    type: 'boolean',
    description:
        'Let autocomplete+ filter and sort the suggestions you provide.',
    default: true
};

module.exports = settings;

/*const _settings = {
  `${consts.CF_MANUAL_SUGGEST}`:{
    type: 'boolean',
    description:"If activated, path autocomplete suggestions are provided only by user request (e.g. with ctrl+space shortcut).",
    default: false
  }
};*/

/*class Config {
    constructor() {}
    isManualSugestOn() {
      return false;
      //return return (atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_MANUAL_SUGGEST}`) === true);
    }
}*/

//export default Config;

/*module.exports = {
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
}*

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
