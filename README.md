# [atom-path-intellisense](https://atom.io/packages/atom-path-intellisense) [![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/logo/Icon-64.png)](https://atom.io/packages/atom-path-intellisense)
### Path Intellisense support for atom.  
Autocomplete provider based on atom [autocomplete-plus](https://atom.io/packages/autocomplete-plus) package.  
[![APM](https://img.shields.io/apm/v/atom-path-intellisense?style=plastic)](https://atom.io/packages/atom-path-intellisense)
[![APM](https://img.shields.io/apm/dm/atom-path-intellisense?color=%23cc6677&style=plastic)](https://atom.io/packages/atom-path-intellisense)
[![Inline docs](http://inch-ci.org/github/apercova/atom-path-intellisense.svg?branch=atom-ci)](http://inch-ci.org/github/apercova/atom-path-intellisense)
[![Maintainability](https://api.codeclimate.com/v1/badges/5cb79bcbdcfc1db02a51/maintainability)](https://codeclimate.com/github/apercova/atom-path-intellisense/maintainability)
[![built with gulp](https://img.shields.io/badge/gulp-ships_this_project-eb4a4b.svg?logo=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAAYAAAAOCAMAAAA7QZ0XAAAABlBMVEUAAAD%2F%2F%2F%2Bl2Z%2FdAAAAAXRSTlMAQObYZgAAABdJREFUeAFjAAFGRjSSEQzwUgwQkjAFAAtaAD0Ls2nMAAAAAElFTkSuQmCC)](http://gulpjs.com/)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/apercova/atom-path-intellisense/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

### Current build status :factory: | See [Change Log :barber:](CHANGELOG.md)
| Linux & MacOS | Windows  |
|---------------|----------|
| [![Build Status](https://travis-ci.org/apercova/atom-path-intellisense.svg?branch=atom-ci)](https://travis-ci.org/apercova/atom-path-intellisense)        | [![Build status](https://ci.appveyor.com/api/projects/status/i39dfbmxa9usjqa1/branch/atom-ci?svg=true)](https://ci.appveyor.com/project/apercova/atom-path-intellisense/branch/atom-ci) |

### Features 
- Provides path suggestions based on typed path and context.
- By default suggestions are provided by pressing `ctrl + space `. Uncheck  **`manual-suggest`** configuration setting to get suggestions at typing.
- Suggestions are provided within scope selectors configured on **` allowed-scopes `** configuration setting. Default selectors cover pretty much languages but is extensible by adding more scope selectors.  
  **` Note to developers `**
  > `If you find any selector combination that's missing or can improve this package make a PR with your add to allowed-scopes configuration setting.`  
- Escaping of single and double quotes is allowed for files and directories.
- Path suggestions mechanism relies on providers for appropriate grammar and selectors. Default path providers are described below.

### Providers
#### Current file path provider _`Default`_
##### :muscle: **_Features_**
- Works out-of-the-box on allowed scope selectors.
- Provides suggestions for current file path.

![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/providers/filepath_provider.gif)  

#### Current file relative path provider _`Default`_
##### :muscle: **_Features_**
- Works out-of-the-box on allowed scope selectors.
- Provides suggestions for paths relative to current file path.
- Relative suggestions are shown by typing self `./` or parent `../` directories.
- Suggestions for paths relative to user's home directory are shown by typing: `~/`.
- Suggestions for paths relative to current project directory are shown by typing forward slash: `/`.
  > When not in a project, suggestions fallback to FileSystem root directory shown files with appropriate permisions.

![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/providers/filepath_rel_provider.gif)  

![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/providers/filepath_rel_provider_home.gif)  

#### Node.js path provider _`Extended`_
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

#### Less path provider _`Extended`_
[Less](http://lesscss.org/) path provider gives suggestions for Less imports.  
##### :muscle: **_Features_**
- It's enabled only at `.source.css.less .string` scope selector.
- It's enabled only at `@import` less statements.
- Filters less files by `.less` extension.
- Removes file extension at selecting any suggestion.
- Gets complemented by _Default path providers_ for path suggestions on broader scopes.

![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/providers/less_provider.gif)

### Installation
Install from atom´s **_settings/packages_** tab or run following command on a terminal:
```bash
  apm install atom-path-intellisense
```

### Configuration
This package exports following configuration settings to **` config.cson `** file:  
##### `manual-suggest`
If enabled (**recomended**), suggestions are provided by pressing `ctrl + space `. Uncheck to get suggestions at typing.  
- _Type:_     `boolean`
- _Default:_  `true`

##### `scope-descriptors`
[Scope selectors](https://flight-manual.atom.io/behind-atom/sections/scoped-settings-scopes-and-scope-descriptors/) (__can be comma-  separated__) for which suggestions are shown. Apply to current file's relative-path suggestion providers. Other providers specify more specific selectors.  
See: [Scope Selectors Reference](https://flight-manual.atom.io/behind-atom/sections/scoped-settings-scopes-and-scope-descriptors/#scope-selectors)  
- _Type:_     `string`
- _Default:_  `'.source .string, .source.shell, .text .string, .text.html.basic'`

##### `provider-strategy-all`
If enabled, All suitable providers that can resolve suggestions are called __(a bit lower operation)__.
- _Type:_     `boolean`
- _Default:_  `false`

##### `enable-debug`
Enable / disable debug options. Note that Atom's dev mode `$ atom --dev .` overrides this setting.
- _Type:_     `boolean`
- _Default:_ 
  - `true` if Atom's dev mode `$ atom --dev .` is enabled.
  - `false` otherwise. 

> Example of _config.cson_:  
```cson
"*":
  "atom-path-intellisense":
    "allowed-scopes": ".source .string, .source.shell, .text .string, .text.html.basic"
    "enable-debug": false
    "manual-suggest": true
    "provider-strategy-all": false
```
### Default Providers :dart:
Default providers are the very basic path suggestion providers on this package.  
Default providers give path suggestions for paths relative to current file.

### Extended providers ❤
Atom-path-intellisense is not only based on default suggestion providers. 
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

### Acknowledgements :trophy:
- Scope selectors matching features are based on [`Atom`](https://github.com/atom) [`selectors.js`](https://github.com/atom/atom/blob/master/src/selectors.js).
- Scope selectors cache is based on [`autocomplete-plus`](https://github.com/atom/autocomplete-plus) [`scope-helpers.js`](https://github.com/atom/autocomplete-plus/blob/master/lib/scope-helpers.js).
- Specs are based on [`autocomplete-paths`](https://github.com/atom-community/autocomplete-paths) [`specs`](https://github.com/atom-community/autocomplete-paths/tree/master/spec) ones.
