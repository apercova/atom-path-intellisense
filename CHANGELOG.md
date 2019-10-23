# Atom-path-Intellisense
## CHANGELOG

### 1.1.x
- Provides path suggestions based on typed path.
- Current file relative path suggestions are provided typing either self (**./**) or parent(**../**) directory location.
- Project folder relative path suggestions are provided typing forward slash (**/**).
- Suggestions are provided at typing by default, but it's also possible to configure them to be provided only by pressing (**_ctrl_ + _space_**) shortcut by setting  **manual-suggest** configuration parameter on true.
- Suggestions are provided within quoted strings both single and double by default.  
It´s possible to configure different scope descriptors in **scope-descriptors** configuration parameter.  
- Escaping of single quotes is allowed within single-quoted strings.


### 1.2.0
- Introduced suggestion model based on providers.
- Default provider for current file path suggestions.
- Default providers for current file relative path suggestions.
- Improvements on default suggestions providers look&feel.
- Provider extensible model for integration of new path providers.
- Formatter extensible model for integration of new formatters.
- Extended Node.js provider.
- Extended Node.js provider formatter.
- Introduced debug mode option. Enabled by default on atom dev mode.
