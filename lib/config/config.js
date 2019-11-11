'use strict';
/**
 *
 * @description Configuration module. Contains functions to handle package
 * config options.
 * @module config/config
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
const consts = require('./consts');
const settings = require('./settings');

/**
 * isManualModeOn - Returns: true if manual mode is enabled; false otherwise.
 *
 * @return {boolean}  true if manual mode is enabled; false otherwise.
 */
function isManualModeOn() {
  return atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_MANUAL_SUGGEST}`) === true;
}

/**
 * getAllowedScopes - Returns allowed scopes selectors for this package.
 *
 * @return {string}  allowed scopes selectors for this package.
 */
function getAllowedScopes() {
  return atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_ALLOWED_SCOPES}`);
}

/**
 * AllProvidersStrategyOn - If enabled, this strategy calls all providers that
 * can resolve suggestions for a possible path avoiding relying on providers
 * priority.
 *
 * @return {boolean}  true if All-Provider suggestion strategy is enabled;
 * false otherwise.
 */
function AllProvidersStrategyOn() {
  return atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_PROVIDER_STRATEGY_ALL}`) === true;
}

/**
 * isDebugEnabled - Returns: true if debugging is enabled; false otherwise.
 *
 * @return {boolean}  true if debugging is enabled; false otherwise.
 */
function isDebugEnabled() {
  return atom.inDevMode() ? true : atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_ENABLE_DEBUG}`) === true;
}

/**
 * getDefaultRootDir - Returns configured defalt root dir.
 *
 * @return {string}  Configured default root dir.
 */
function getDefaultRootDir() {
  return atom.config.get(`${consts.PACKAGE_NAME}.${consts.CF_DEFAULT_ROOT_DIR}`);
}

/**
 * addObserver - Adds an observer for a given atom-path-intellisense config
 * property.
 *
 * @param  {string} conf Property name.
 * @param  {function} fn The observer.
 * @return {Disposable} Disposable object related to added observer.
 */
function addObserver(conf, fn) {
  return atom.config.observe(`${consts.PACKAGE_NAME}.${conf}`, fn);
}

module.exports = {
  settings,
  isManualModeOn,
  getAllowedScopes,
  AllProvidersStrategyOn,
  isDebugEnabled,
  getDefaultRootDir,
  addObserver
};
