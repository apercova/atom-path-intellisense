## Extended providers ❤
Atom-path-intellisense is not only based on default providers.
Decoupling path suggestions mechanism from autocomplete-plus provider API gives the advantage of writing extended providers that cover more specific contexts and can be formatted in their own way.

> We refer as extended providers to providers targeted to a specific language or more specific scope selectors and context.

### [Node.js (https://nodejs.org)](https://nodejs.org) path provider _`Extended`_
Gives path suggestions for Node.js module imports.
##### :muscle: **_Features_**
- It's enabled on `JavaScript`, `CoffeeScript` and `TypeScript` files at `.string.quoted` scope selector.
- Supports both `require()` and ES6 module `import` statements.
- Provides suggestions for Node.js built-in modules, local modules (_on project_ `node_modules` _directory_) and modules relative to current file.
- Filters JavaScript files by `.js` extension.
- Removes file extension at selecting any suggestion.
- Is complemented by _Default path providers_ for path suggestions on broader scopes.

![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/providers/node_provider.gif)

### [Less (http://lesscss.org)](http://lesscss.org) _`Extended`_
Gives path suggestions for less `@import` statements.
##### :muscle: **_Features_**
- It's enabled only at valid less `@import` statements.
- Filters files by `.css` and `.less` extensions.
- Removes file extension at selecting any suggestion.
- Is complemented by _Default path providers_ for path suggestions on broader scopes.

![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/providers/lesscss_provider.gif)

## Development
An extended provider has to be in compliance with the following:
- Extend base class `BasePathProvider`.
- Override following `BasePathProvider` instance variables:
  - id
  - priority
  - scopeSelector
  - formatter (_optional_). Defaults to `new DefaultFormatter({ .. conf });`
  - fileExtFilter (_optional_). Defaults to empty Array.  
- Implement following `BasePathProvider` functions:
  - `canResolve()`
  - `resolve()`
  - `activate`. (_optional_)
  - `deactivate`. (_optional_)  

- Optionally use a custom formatter. Eg. to give more information on suggestions.
  Custom formatters have to be in compliance with the following:
  - Extend base class `BaseFormatter`.
  - Implement `format()` function that is passed raw suggestions.  
