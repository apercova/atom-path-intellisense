'use strict';
/**
 *
 * @description Constants module. Contains constant values for package use.
 * @module config/consts
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
module.exports = {
  /** Package's name. */
  'PACKAGE_NAME': 'atom-path-intellisense',
  /** Enable / Disable for manual suggestions. */
  'CF_MANUAL_SUGGEST': 'manual-suggest',
  /** Scope selector for allowed scopes. */
  'CF_ALLOWED_SCOPES': 'allowed-scopes',
  /** Enable / Disable All-Provider suggestions strategy. */
  'CF_PROVIDER_STRATEGY_ALL': 'provider-strategy-all',
  /** Enable / Disable debugging. */
  'CF_ENABLE_DEBUG': 'enable-debug',
  /** Default base path for relative path suggestions (/). */
  'CF_DEFAULT_ROOT_DIR': 'root-base-path',
  /** Special value for CF_DEFAULT_ROOT_DIR setting meant to be set to filesystem root path (/). */
  'FILE_SYSTEM_ROOT': 'system',
  /** Special value for CF_DEFAULT_ROOT_DIR setting meant to set to project root path (/). */
  'PROJECT_ROOT': 'project'
};
