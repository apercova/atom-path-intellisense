'use babel'

import consts from "./consts.js";

const settings = {};
settings[`${consts.CF_MANUAL_SUGGEST}`] = {
  type: 'boolean',
  description:"By default (**recomended**), suggestions are shown by pressing `ctrl` + `space` shortcut . uncheck to get suggestions at typing.",
  default: false
};
settings[`${consts.CF_ALLOWED_SCOPES}`] = {
  type: 'string',
  description:"[Scope selectors](https://flight-manual.atom.io/behind-atom/sections/scoped-settings-scopes-and-scope-descriptors/) (__can be comma-separated__) for which suggestions will be shown for default file's relative-path suggestion providers.",
  default: '.source .string.quoted, .text.xml .string.quoted'
};
export default settings;
