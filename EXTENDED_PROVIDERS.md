## Extended providers ❤
Atom-path-intellisense is not only based on default providers. 
Decoupling path suggestions mechanism from autocomplete-plus provider API gives the advantage of writing extended providers that cover more specific contexts and can be formatted in their own way.

> We refer as extended providers to providers targeted to a specific language or more specific scope selectors and context.

An extended provider has to be in compliance with the following:
- Extend base class `BasePathProvider`.  
- Implement following methods:
  - `canResolve()`
  - `resolve()`
  - `activate`. (optional)
  - `deactivate`. (optional)
- Optionally use a custom formatter. Eg. to trim file extensions.
  Custom formatters have to be in compliance with the following:  
  - Extend base class `BaseFormatter`.  
  - Implement `format` method in order to format raw suggestions.


### Node.js path provider _`Extended`_
[Node.js](nodejs.org/) path provider gives suggestions for Node.js module imports.  
##### :muscle: **_Features_**
- It's enabled only at `.source.js .string.quoted` scope selector.
- It's enabled only at `require()` and ES6 module `import` statements.
- Provides suggestions for Node.js built-in modules, local modules on project `node_modules` directory and modules relative to current file.
- Filters JavaScript files by `.js` extension.
- Removes file extension at selecting any suggestion.
- Gets complemented by _Current file relative path provider_ provider on ES6 module `import` statements for relative paths. Eg. `import settings from './config/settings.js'`.
- Gets complemented by _Default path providers_ for path suggestions on broader scopes.

![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/providers/node_provider.gif)

### Less path provider _`Extended`_
[Less](http://lesscss.org/) path provider gives suggestions for Less imports.  
##### :muscle: **_Features_**
- It's enabled only at `.source.css.less .meta.at-rule.import.css` scope selector.
- It's enabled only at `@import` less statements.
- Filters files by `.less` extension.
- Removes file extension at selecting any suggestion.
- Gets complemented by _Default path providers_ for path suggestions on broader scopes.

![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/providers/less_provider.gif)

### Sass path provider _`Extended`_
[Less](http://lesscss.org/) path provider gives suggestions for Less imports.  
##### :muscle: **_Features_**
- It's enabled only at following scope selectors:
  - `.source.sass .meta.at-rule.import.sass`
  - `.source.sass .meta.selector.css`
  - `.source.css.scss .meta.at-rule.import.scss .string`
- It's enabled at `@import`, `@use` and `@forward` sass statements.
- Filters less files by `.scss`, `.sass` and `.css` extension.
- Removes file extension at selecting any suggestion.
- Gets complemented by _Default path providers_ for path suggestions on broader scopes.

![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/providers/sass_provider.gif)
