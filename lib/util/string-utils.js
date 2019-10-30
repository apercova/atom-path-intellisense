'use strict';
/**
 *
 * @description String utils module. Contains functions to handle strings.
 * @module util/string-utils
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */

/**
 * escapeStringQuote - Escape string quotation characters.
 *
 * @param  {string} str The string to escape.
 * @return {string}     The escaped string.
 */
function escapeStringQuote(str) {
  str = str || '';
  str = str.replace(new RegExp(/'/, 'g'), "\\'");
  str = str.replace(new RegExp(/"/, 'g'), '\\"');
  return str;
}

/**
 * unescapeStringQuote - Unescape string quotation characters.
 *
 * @param  {string} str The string to unescape.
 * @return {string}     The unescaped string.
 */
function unescapeStringQuote(str) {
  str = str || '';
  str = str.replace(new RegExp(/\\'/, 'g'), "'");
  str = str.replace(new RegExp(/\\"/, 'g'), '"');
  return str;
}

module.exports = { escapeStringQuote, unescapeStringQuote };
