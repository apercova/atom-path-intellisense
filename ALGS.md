## Algorithms for matching suggestions based on paths (_Draft_ 2019-09-12)

> Notes:
> - Only suggestions for current line are supported.  
> - Path Providers are passed:  
>	- Current line  
>	- Cursor position

### Relative-path Path Provider `(.\ | ..\)`
---
#### Description
Identifies whether current line matches a relative path beginning characters `./` or `../` using proper regex.  
Retrieves path relative to current file directory.
#### Config
- `Priority: 9997`
#### Steps  
If current line matches a relative path using proper regex then iterates all matches as `test-path` taking a text fragmet from match start position up to cursor position and using `current-file path` as `$BASE_PATH`.  
For example: `$BASE_PATH/{text-fragment}`

For each iteration performs as follows:  
1. Identifies whether `test-path` is valid by evaluating if it matches a path pattern using proper regex.  
	- If `test-path` is not valid, return `false` as `$SEARCH_PATH`
	- If `test-path` is valid evaluates if it is a file or a directory.
		- If `test-path` is a file, take parent path as `test-path`.
	- Evaluates if `test-path` does exist.
	- If `test-path` does not exist, return `false` as `$SEARCH_PATH`.
	- If `test-path` does exist, returns it as `$SEARCH_PATH`.  

2. Prioritizes `$SEARCH_PATH` for each iteration as follows:

	- Valid `$SEARCH_PATH` for **farest** match back from cursor position has the **maximum** priority.  
	- Valid `$SEARCH_PATH` for **nearest** match back from cursor position has the **minimum** priorty.  

3. Returns Valid `$SEARCH_PATH` with maximum priority appending text following `$SEARCH_PATH` up to cursor position as the `$SEARCH_TERM`:

*For example:*  
Consider file `foo.js` in path `dir1/`.  
Consider current line (Where `|` indicates cursor position) as:  

`path="./file1.json" more content.. path="../dir3/../dir2/file.2|`

Test paths are:  

- (1)	`%BASE_PATH%/`**`./file1.json" more content.. path="../dir3/../dir2/file.2`**`|`
- (2)	`%BASE_PATH%/`**`../dir3/../dir2/file.2`**|`
- (3)	`%BASE_PATH%/`**`../dir2/file.2`**|`


And evaluates a as follow:  

- Option (1) is a valid path by testing against regex but does not exist.  
- Both options (2) and (3) are valid and existing paths.  
- Option (2) has the maximum priority what is obvious as option (3) is a subpath of option (2), so option (2) is returned as follows:  
	- `%BASE_PATH%/../dir3/../dir2/` is returned as **`$SEARCH_PATH`**
	- `file.2` is returned as **`$SEARCH_TERM`**


textMatch (1) has the minimum priority, while textMatch (3) has the maximum priority.



### Project-path Path Provider `(.\ | ..\)`
---
#### Description
Identifies whether current line matches a forward slash (/) using proper regex.  
Retrieves path relative to project directory.
#### Config
- `Priority: 9998`
#### Steps

Identify whether text matches a forward slash (/) using proper regex ($FSLASH_REGEX)
If text matches then iterate all matches taking text from match position up to cursor position and taking proyect dir as base path ($BASE_PATH)

For each iteration:
		Identify whether text matches a path using proper regex ($PATH_REGEX)
		If text matches then resolve suggestions taking path priority into consideration for suggestions as follows:
			Suggestions for nearest match back from cursor position have the maximum priorty.
			Suggestions for farest match back from cursor position have the minimum priority.
Return suggestions properly

For example, considering current line as:

		path="/file1.json" more content.. path="/dir1/file/2.json

(1)	%BASE_PATH%/file1.json" more content.. path="/dir1/file/2.json
(2)	%BASE_PATH%/dir1/file/2.json
(3)	%BASE_PATH%/file/2.json
(4)	%BASE_PATH%/2.json



### Current-word Path Provider `(\w)`
---
#### Description
Provides suggestions from current-file directory using current word as search term.  
Retrieves current file directory.  
Has the maximum execution priority as it's intended to be the last suggest provider option.
#### Config
- `Priority: 9999`
#### Steps

Shows files at current-file directory as suggestions for last word back from cursor relying on atom-autocomplete suggestions mechanism.  

For example, considering current line as:

		file content content.. path="dir1

Takes `dir1` word as input for autocomplete-plus in order to show suggestions.

	- `current-file path` is returned as **`$SEARCH_PATH`**
	- `dir1` is returned as **`$SEARCH_TERM`**
