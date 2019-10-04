module.exports = { selectorMatchesAnyScope, selectorMatchesAllScopes, matcherForSelector, isSubset };

function always(scope) { return true; }

function parse(selector) {
  return typeof selector === 'string'
    ? selector.replace(/^\./, '').replace(/^\s/, '').split('.')
    : selector;
}

function matcherForSelector(selector) {
  const parts = parse(selector);
  if (typeof parts === 'function') return parts;
  return selector ? scope => isSubset(parts, parse(scope)) : always;
}

function selectorMatchesAnyScope(selector, scopes) {
  return !selector || scopes.some(matcherForSelector(selector));
}

function selectorMatchesAllScopes(selector, scopes) {
  if (!selector) return false;
  if (selector === '*') return true;
  // '.source.js string.quoted' => [".source.js","string.quoted"]
  const selectorTokens = selector.trim().split(/[\t\s]+/);
  return selectorTokens.every(selector => {
    return selectorMatchesAnyScope(selector, scopes);
  });
}

function isSubset(subset, superset) {
  return (Array.isArray(subset) && Array.isArray(superset)) &&
          subset
          .filter(sub => superset.includes(sub))
          .length === subset.length;
}
