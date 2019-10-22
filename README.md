# [atom-path-intellisense](https://atom.io/packages/atom-path-intellisense)
## Path Intellisense support for atom.  
Autocomplete provider based on atom [autocomplete-plus](https://atom.io/packages/autocomplete-plus) package.  

### Current build status | __See [Change Log](CHANGELOG.md)__
| Linux & MacOS | Windows  | | |
|---------------|----------|-|-|
| [![Build Status](https://travis-ci.org/apercova/atom-path-intellisense.svg?branch=atom-ci)](https://travis-ci.org/apercova/atom-path-intellisense)        | [![Build status](https://ci.appveyor.com/api/projects/status/i39dfbmxa9usjqa1/branch/atom-ci?svg=true)](https://ci.appveyor.com/project/apercova/atom-path-intellisense/branch/atom-ci) | [![built with gulp](https://img.shields.io/badge/gulp-ships_this_project-eb4a4b.svg?logo=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAAYAAAAOCAMAAAA7QZ0XAAAABlBMVEUAAAD%2F%2F%2F%2Bl2Z%2FdAAAAAXRSTlMAQObYZgAAABdJREFUeAFjAAFGRjSSEQzwUgwQkjAFAAtaAD0Ls2nMAAAAAElFTkSuQmCC)](http://gulpjs.com/) | [![APM](https://img.shields.io/apm/dm/atom-path-intellisense?color=%23cc6677&style=plastic)](https://atom.io/packages/atom-path-intellisense) |

### Features
:heavy_check_mark: Provides path suggestions based on typed path and context.  
:heavy_check_mark: Suggestions are provided at typing by default, but it's also possible to configure them to be provided only by       pressing (**_ctrl_ + _space_**) shortcut by setting  **manual-suggest** configuration setting on true.  
:heavy_check_mark: Suggestions are provided within valid configured scope selectors on **allowed-scopes** configuration setting. Default value covers pretty much languages but is extensible adding more scope selectors.  

  ``Note to developers``
  > If you find any selector that could improve this package make a pull request for default **allowed-scopes** configuration setting value.  
  
:heavy_check_mark: Escaping of single and double quotes is allowed for files and directories.  
:heavy_check_mark: Path suggestions mechanism relies on providers for appropriate grammar and selectors. Default path providers are described below.

### Default providers
Give path suggestions relative to current file path.

#### Current file path provider
##### **_Features_**
:heavy_check_mark: Works out-of-the-box on all configured scope selectors.  
:heavy_check_mark: Current file path suggestions are provided for typed word.  

![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/providers/filepath_provider.gif)  

#### Current file relative path provider
##### **_Features_**
:heavy_check_mark: Works out-of-the-box on all configured scope selectors.  
:heavy_check_mark: Current file relative path suggestions are provided typing either self `./` or parent `../` directories.  
:heavy_check_mark: User's home directory path suggestions are provided typing: `~/`.  
:heavy_check_mark: Project directory relative path suggestions are provided typing forward slash: `/`.  
  > When not in a project, suggestions fallback to FileSystem root dir shown files with appropriate permisions.  

![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/providers/filepath_rel_provider.gif)  
![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/providers/filepath_rel_provider_home.gif)  
  

### Extended providers
Atom-path-intellisense is not only based on default providers providers. 
Decoupling path suggestion mechanism from autocomplete-plus provider API gives the advantage of writing specific providers that cover less general contexts.

> As extended providers we refer to providers targeted to a specific language or more specific scope selectors and/or context.

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

#### Node.js path provider (Extended)
Node.js path provider gives suggestions for Node.js module imports.  
##### **_Features_**
:heavy_check_mark: It's enabled only at `.source.js .string.quoted` scope selector.  
:heavy_check_mark: It's enabled only at `require()` and ES6 module `import` statements.  
:heavy_check_mark: Filters JavaScript files by `.js` extension.  
:heavy_check_mark: Removes file extension at selecting any suggestion.  
:heavy_check_mark:- Gets complemented by _Current file relative path provider_  provider on ES6 module `import` statements for relative paths. Eg.  

  `import settings from './config/settings.js'`. 

![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/providers/node_provider.gif)

### Installation
Install from atom´s **_settings/packages_** tab or run following command on a terminal:
```bash
  apm install atom-path-intellisense
```

### Configuration
This package exports following configuration settings to **config.cson** file:  
##### manual-suggest
> if enabled (**recomended**), suggestions are shown by pressing `ctrl` + `space` shortcut. Uncheck to get suggestions at typing.   
- Type:    `boolean`
- Default: `false`

##### scope-descriptors
> [Scope selectors](https://flight-manual.atom.io/behind-atom/sections/scoped-settings-scopes-and-scope-descriptors/) (__can be comma-  separated__) for which suggestions are shown. Apply to current file's relative-path suggestion providers. Other providers specify more specific selectors.  
See: [Scope Selectors Reference](https://flight-manual.atom.io/behind-atom/sections/scoped-settings-scopes-and-scope-descriptors/#scope-selectors)  
- Type:    `string`
- Default: `'.source .string, .source.shell, .text .string, .text.html.basic'`

##### provider-strategy-all
> If enabled, All providers that can resolve suggestions are called __(A bit lower operation)__.
- Type:    `boolean`
- Default: `false`

##### enable-debug
> Enable / disable debug options. Note that Atom's dev mode `$ atom --dev .` overrides this setting.
- Type: `boolean`
- Default: 
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
