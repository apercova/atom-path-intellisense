# atom-path-intellisense
## Path Intellisense support for atom.  
#### Autocomplete provider based on atom [autocomplete+](https://atom.io/packages/autocomplete) package

- Provides automatic path suggestions at writing either self (**./**) or parent(**../**) directory location.
- Configurable path suggestions when pressing (**_ctrl_ _+_ _space_**) shortcut. Disabled by default.
- Exports following configuration settings to config.cson file:
    - manual-suggest: _"Manual"_ path suggestions only when pressing (**_ctrl_ _+_ _space_**) shortcut.

```json
    "atom-path-intellisense"
      "manual-suggest" : false
```

![](https://github.com/apercova/atom-path-intellisense/blob/master/img/atom-pi-01.png?raw=true)  
![](https://github.com/apercova/atom-path-intellisense/blob/master/img/atom-pi-02.png?raw=true) 
