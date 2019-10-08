module.exports = { selectorMatchesAnyScope, selectorMatchesAllScopes, matcherForSelector, isSubset };

const EscapeCharacterRegex = /[-!"#$%&'*+,/:;=?@|^~()<>{}[\]]/g;
const cachedMatchesBySelector = {};


function getCachedMatch(selector, scopeChain){
  const cachedMatchesByScopeChain = cachedMatchesBySelector[selector];
  return cachedMatchesByScopeChain ? cachedMatchesByScopeChain[scopeChain] : undefined;
}

function setCachedMatch (selector, scopeChain, match) {
  let cachedMatchesByScopeChain = cachedMatchesBySelector[selector]
  if (!cachedMatchesByScopeChain) {
    cachedMatchesByScopeChain = {}
    cachedMatchesBySelector[selector] = cachedMatchesByScopeChain
  }
  cachedMatchesByScopeChain[scopeChain] = match
  return cachedMatchesByScopeChain[scopeChain];
}

//-----------------------------------------------------------------------------------
function always(scope) { return true; }

function parse(selector) {
  return typeof selector === 'string'
    ? selector.replace(/^\./, '').replace(/^\s/, '').split('.')
    : selector;
}

function buildScopeChain(scopes) {
  return `.${scopes.join(' .')}`;
}

function isSubset(subset, superset) {
  return (Array.isArray(subset) && Array.isArray(superset)) &&
          subset
          .filter(sub => superset.includes(sub))
          .length === subset.length;
}

function matcherForSelector(selector) {
  const parts = parse(selector);
  if (typeof parts === 'function') return parts;
  return selector ? scope => isSubset(parts, parse(scope)) : always;
}

function _singleSelectorMatchesAnyScope(selector, scopes) {
  return !selector || scopes.some(matcherForSelector(selector));
}

function selectorMatchesAnyScope(selector, scopes) {
    if (!selector) return false;
    if (!Array.isArray(scopes)) return false;
    if (selector === '*') return true;
    // Supports smultiple nested selectors. Eg. '.source.js .string.quoted'
    const selectors = selector.trim().split(/[\t\s]+/);
    return selectors.some(_selector => scopes.some(matcherForSelector(_selector)));

    return false;
}

function selectorMatchesAllScopes(selector, scopes) {
  if (!selector) return false;
  if (!Array.isArray(scopes)) return false;
  if (selector === '*') return true;
  //-----Include cache
  const scopeChain = buildScopeChain(scopes);
  const cachedMatch = getCachedMatch(selector, scopeChain);
  if (cachedMatch != null) {
    //console.warn(`Match for selector [${selector}] found in cache: [${cachedMatch}]`);
    return cachedMatch;
  } else {
    const selectorTokens = selector.trim().split(/[\t\s]+/);
    const match = selectorTokens.every(selector => {
      return selectorMatchesAnyScope(selector, scopes);
    });
    setCachedMatch(selector, scopeChain, match);
    //console.warn(`Match for selector [${selector}] added to cache: [${match}]`);
    return match;
  }

  function selectorsMatchesAllScopes()

  //------------------
  // '.source.js string.quoted' => [".source.js","string.quoted"]
  /*const selectorTokens = selector.trim().split(/[\t\s]+/);
  return selectorTokens.every(selector => {
    return selectorMatchesAnyScope(selector, scopes);
  });¨*/
}
