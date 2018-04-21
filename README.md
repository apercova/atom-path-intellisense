# [atom-path-intellisense](https://atom.io/packages/atom-path-intellisense)
## Path Intellisense support for atom.  
Autocomplete provider based on atom [autocomplete-plus](https://atom.io/packages/autocomplete-plus) package

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
If set to true, path suggestions are provided _manually_ only by pressing (**_ctrl_ + _space_**) shortcut.  

- **scope-descriptors**  
Array of scope descriptors to allow suggestions within them.  
Quoted strings both single and double are supported by default.  
See: [Scope Descriptors](https://flight-manual.atom.io/behind-atom/sections/scoped-settings-scopes-and-scope-descriptors/#scope-descriptors)

> #### Example of _config.cson_ file:  
```cson
"*":
  "atom-path-intellisense":
    "manual-suggest": "false"
    "scope-descriptors": [
      "string.quoted.single"
      "string.quoted.double"
    ]
```

### Screenshots
![](https://github.com/apercova/imageio/blob/master/atom-path-intellisense/pi-01.png?raw=true)  

![](https://github.com/apercova/imageio/blob/master/atom-path-intellisense/pi-02.png?raw=true)

![](https://github.com/apercova/imageio/blob/master/atom-path-intellisense/pi-03.png?raw=true)
