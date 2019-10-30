'use strict';
/**
 *
 * @description Path utils module. Contains common used functions related to paths and fs .
 * @module util/paths-utils
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
const fs = require('fs');

/**
 * pathDoesExistSync - Determines whether a path exists or not.
 *
 * @param  {string}  somePath Path to test for existence.
 * @return {boolean}          true if given path does exist. false otherwise.
 */
function pathDoesExistSync(somePath) {
  try {
    fs.accessSync(somePath || '', fs.constants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * getPathStatsSync - Retrieves path stats.
 *
 * @param  {string}   somePath Path to get stats from.
 * @return {fs.Stats}          Path stats.
 */
function getPathStatsSync(somePath) {
  return fs.statSync(somePath);
}

/**
 * pathIsDirectory - Evaluates wheter a given path is a directory or not.
 *
 * @param  {string} somePath       Path to evaluate.
 * @param  {string} checkExistense Indicates whether check for path to exist. Default is false.
 * @return {boolean}               true if path is a directory. false otherwise.
 */
function pathIsDirectory(somePath, checkExistense) {
  let res = checkExistense ? this.pathDoesExistSync(somePath) : true;
  return res && this.getPathStatsSync(somePath).isDirectory();
}

module.exports = { pathDoesExistSync, getPathStatsSync, pathIsDirectory };
