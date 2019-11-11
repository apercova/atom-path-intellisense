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
 * getSuggestions - Simulates package getSuggestions function.
 *
 * @param  {string} provider Provider.
 * @param  {string} editor   Text editor.
 * @return {Promise}         Suggestions.
 */
function getSuggestions(provider, editor) {
  const cursor = editor.getLastCursor();
  const start = cursor.getBeginningOfCurrentWordBufferPosition();
  const end = cursor.getBufferPosition();
  const prefix = editor.getTextInRange([start, end]);
  const request = {
    'editor': editor,
    'bufferPosition': end,
    'scopeDescriptor': cursor.getScopeDescriptor(),
    prefix
  };
  return provider.getSuggestions(request);
}

module.exports = {
  getSuggestions
};
