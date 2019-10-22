# [atom-path-intellisense](https://atom.io/packages/atom-path-intellisense)
## Path Intellisense support for atom.  
Autocomplete provider based on atom [autocomplete-plus](https://atom.io/packages/autocomplete-plus) package.  

#### Current build status
| Linux & MacOS | Windows  |
|---------------|----------|
| [![Build Status](https://travis-ci.org/apercova/atom-path-intellisense.svg?branch=atom-ci)](https://travis-ci.org/apercova/atom-path-intellisense)        | [![Build status](https://ci.appveyor.com/api/projects/status/i39dfbmxa9usjqa1/branch/atom-ci?svg=true)](https://ci.appveyor.com/project/apercova/atom-path-intellisense/branch/atom-ci) |

### Features
- Provides path suggestions based on typed path.
- Current file relative path suggestions are provided typing either self (**./**) or parent(**../**) directory location.
- Project folder relative path suggestions are provided typing forward slash (**/**).
- Suggestions are provided at typing by default, but it's also possible to configure them to be provided only by pressing (**_ctrl_ + _space_**) shortcut by setting  **manual-suggest** configuration parameter on true.
- Suggestions are provided within quoted strings both single and double by default.  
It´s possible to configure different scope descriptors in **scope-descriptors** configuration parameter.  
- Escaping of single quotes is allowed within single-quoted strings.

### Installation
Install from atom´s **_settings/packages_** tab or run following command on a terminal:
```bash
  apm install atom-path-intellisense
```

### Configuration
This package exports following configuration settings to **config.cson** file:  
- **manual-suggest**  
  > if enabled (**recomended**), suggestions are shown by pressing `ctrl` + `space` shortcut. Uncheck to get suggestions at typing.   
  - Type:    `boolean`
  - Default: `false`

- **scope-descriptors**  
  > [Scope selectors](https://flight-manual.atom.io/behind-atom/sections/scoped-settings-scopes-and-scope-descriptors/) (__can be comma-  separated__) for which suggestions are shown. Apply to current file's relative-path suggestion providers. Other providers specify more specific selectors.  
See: [Scope Selectors Reference](https://flight-manual.atom.io/behind-atom/sections/scoped-settings-scopes-and-scope-descriptors/#scope-selectors)  
  - Type:    `string`
  - Default: `'.source .string, .source.shell, .text .string, .text.html.basic'`

- **provider-strategy-all**
  > If enabled, All providers that can resolve suggestions are called __(A bit lower operation)__.
  - Type:    `boolean`
  - Default: `false`

- **enable-debug**
  > Enable / disable debug options. Note that Atom's dev mode `$ atom --dev .` overrides this setting.
  - Type: `boolean`
  - Default: 
    - `true` if Atom's dev mode `$ atom --dev .` is enabled.
    - `false` otherwise. 


> #### Example of _config.cson_ file:  
```cson
"*":
  "atom-path-intellisense":
    "allowed-scopes": ".source .string, .source.shell, .text .string, .text.html.basic"
    "enable-debug": false
    "manual-suggest": true
    "provider-strategy-all": false
```
### Providers
#### Node.js provider
Node.js path provider offers suggestions more Node.js friendly.
- Is enabled only at `.source.js .string.quoted` scope selector.  
- Filters JavaScript files by `.js` extension.  
- Removes file extension at selecting any suggestion.  
- Works on  `require()` and ES6 module `import` statements.  

![](https://raw.githubusercontent.com/apercova/imageio/master/atom-path-intellisense/providers/nodejs_provider.gif)


### Screenshots
![](https://github.com/apercova/imageio/blob/master/atom-path-intellisense/pi-01.png?raw=true)  

![](https://github.com/apercova/imageio/blob/master/atom-path-intellisense/pi-02.png?raw=true)

![](https://github.com/apercova/imageio/blob/master/atom-path-intellisense/pi-03.png?raw=true)
