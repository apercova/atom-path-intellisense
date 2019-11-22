# Atom-path-Intellisense
## CHANGELOG :barber:

### 1.2.2
- Fixed bug [#74 configs disappear](https://github.com/apercova/atom-path-intellisense/issues/74)  

### 1.2.1
- Improved matching algorithm for Node.js provider, included multiline ES6 import statements.
- Included `.source.ts` and `.source.coffee` grammar selectors on Node.js provider.
- Fixed current file path provider scope selectors to: `.string.quoted', '.text .string', '.text.html.basic'`.
- Added `root-base-path` setting to support configurable root base path for absolute (`/`) paths.

### 1.2.0
- New algorithm for iterative path search.
- New extensible suggestion model based on path providers with own grammar and context.
- Default suggestion provider for current-file path.
- Default suggestion provider for paths relative to current file path.
- Improvements suggestions look&feel.
- New extensible formatter model for custom formatters integration.
- New Node.js path suggestions provider.
- New Node.js formatter.
- Improved scope selectors validation.
- Manual suggestion mode enabled by default.
- Redefined allowed scope selectors.
- Default strategy to find most suitable provider based on priority and scope selectors.
- Optional strategy to find all suitable providers based only on scope selectors. Disabled by default.
- Added debug mode option. Enabled by default on atom dev mode.

### 1.1.x
- Provides path suggestions based on typed path.
- Current file relative path suggestions are provided typing either self (**./**) or parent(**../**) directory location.
- Project folder relative path suggestions are provided typing forward slash (**/**).
- Suggestions are provided at typing by default, but it's also possible to configure them to be provided only by pressing (**_ctrl_ + _space_**) shortcut by setting  **manual-suggest** configuration parameter on true.
- Suggestions are provided within quoted strings both single and double by default.  
It´s possible to configure different scope descriptors in **scope-descriptors** configuration parameter.  
- Escaping of single quotes is allowed within single-quoted strings.
