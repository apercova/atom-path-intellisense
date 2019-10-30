'use strict';
/**
 *
 * @description Settings module. Contains settings definition for package.
 * @module config/settings
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
const consts = require('./consts');

/**
 * Settings object.
 * @see {@link https://flight-manual.atom.io/behind-atom/sections/configuration-api/|Configuration API}
 */
const settings = {};
settings[`${consts.CF_MANUAL_SUGGEST}`] = {
  type: 'boolean',
  description:
    'if enabled (**recomended**), suggestions are shown by pressing `ctrl` + `space` shortcut. Uncheck to get ' +
    'suggestions at typing. Enabled by default.',
  default: true
};
settings[`${consts.CF_ALLOWED_SCOPES}`] = {
  type: 'string',
  description:
    '[Scope selectors](https://flight-manual.atom.io/behind-atom/sections/scoped-settings-scopes-and-scope-' +
    "descriptors/) (__can be comma-separated__) for which suggestions are shown. Apply to current file's " +
    'relative-path suggestion providers. Other providers specify more specific selectors.',
  default: '.source .string, .source.css.scss, .source.shell, .text .string, .text.html.basic'
};
settings[`${consts.CF_PROVIDER_STRATEGY_ALL}`] = {
  type: 'boolean',
  description:
    'If activated, All providers that can resolve suggestions are called (A bit lower operation). Disabled by default.',
  default: false
};
settings[`${consts.CF_ENABLE_DEBUG}`] = {
  type: 'boolean',
  description:
    "If activated, it enables debug options for this package. Note that Atom's dev mode `$ atom --dev .` overrides " +
    'this setting.',
  default: 'false'
};

module.exports = settings;
