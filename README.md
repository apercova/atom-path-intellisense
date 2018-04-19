# atom-path-intellisense
## Path Intellisense support for atom.  
Autocomplete provider based on atom [autocomplete-plus](https://atom.io/packages/autocomplete-plus) package

### Features
- Provides path suggestions based on typed path.
- Current file relative path suggestions are provided typing either self (**./**) or parent(**../**) directory location.
- Project folder relative path suggestions are provided typing forward slash (**/**).
- By default, suggestions are provided at typing, but it's also possible to configure suggestions to be provided only by pressing (**_ctrl_ + _space_**) shortcut by setting  **manual-suggest** configuration parameter on true.
- By default suggestions are provided within quoted strings both single and double.  
It´s possible to configure different scope descriptors in **scope-descriptors** configuration parameter.


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
    "manual-suggest": "true"
    "scope-descriptors": [
      "string.quoted.single"
      "string.quoted.double"
    ]
```
### Screenshots
![](https://github.com/apercova/atom-path-intellisense/blob/master/img/pi-01.png?raw=true)  

![](https://github.com/apercova/atom-path-intellisense/blob/master/img/pi-02.png?raw=true)

![](https://github.com/apercova/atom-path-intellisense/blob/master/img/pi-03.png?raw=true)
