'use babel'

import consts from "./consts.js";

const settings = {};
settings[`${consts.CF_MANUAL_SUGGEST}`] = {
  type: 'boolean',
  description:"if activated (**recomended**), suggestions are shown by pressing `ctrl` + `space` shortcut. Uncheck to get suggestions at typing.",
  default: false
};
settings[`${consts.CF_ALLOWED_SCOPES}`] = {
  type: 'string',
  description:"[Scope selectors](https://flight-manual.atom.io/behind-atom/sections/scoped-settings-scopes-and-scope-descriptors/) (__can be comma-separated__) for which suggestions are shown. Apply to current file's relative-path suggestion providers. Other providers specify more specific selectors.",
  default: '.source .string.quoted, .text .string.quoted'
};
settings[`${consts.CF_PROVIDER_STRATEGY_ALL}`] = {
  type: 'boolean',
  description:"If activated. all providers that can resolve suggestions are invoked (A bit lower operation). Disabled by default.",
  default: false
};

export default settings;
