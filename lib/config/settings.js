'use babel'

import consts from "./consts.js";

const settings = {};
settings[`${consts.CF_MANUAL_SUGGEST}`] = {
  type: 'boolean',
  description:"If activated, path autocomplete suggestions are provided only by user request (e.g. with ctrl+space shortcut).",
  default: false
};
settings[`${consts.CF_ALLOWED_SCOPES}`] = {
  type: 'string',
  description:"Defines the scope selector(s) (can be comma-separated) for which suggestions should be given.",
  default: '*'
};
export default settings;
