# atom-path-intellisense
## Path Intellisense support for atom.  
Autocomplete provider based on atom [autocomplete+](https://atom.io/packages/autocomplete) package

### Features
- Provides path suggestions based on typed path.
- Current file relative path suggestions are provided typing either self (**./**) or parent(**../**) directory location.
- Project folder relative path suggestions are provided typing forward slash (**/**).
- By default, suggestions are provided at typing, but it's also possible to configure suggestions to be provided only by pressing (**_ctrl_ + _space_**) shortcut by setting  **manual-suggest** configuration parameter on true.

### Configuration
- This package exports following configuration settings to **config.cson** file:  
    - **manual-suggest**: If set to true, path suggestions are provided _manually_ only by pressing (**_ctrl_ + _space_**) shortcut.

```cson
    "atom-path-intellisense"
      "manual-suggest" : false
```
### Examples
![](https://github.com/apercova/atom-path-intellisense/blob/master/img/pi-01.png?raw=true)  

![](https://github.com/apercova/atom-path-intellisense/blob/master/img/pi-02.png?raw=true)

![](https://github.com/apercova/atom-path-intellisense/blob/master/img/pi-03.png?raw=true)
