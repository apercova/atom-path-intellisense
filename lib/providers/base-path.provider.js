const path = require('path');
const fs = require('fs');
const logger = require('../util/logger');
const stringUtils = require('../util/string-utils');
const SearchPathDTO = require('../dto/search-path.dto');
const SuggestionsDTO = require('../dto/suggestions.dto');

/**
 * Base path provider class
 * @author {@literal @}apercova
 * <a href="https://github.com/apercova" target="_blank">https://github.com/apercova</a>
 * <a href="https://twitter.com/apercova" target="_blank">{@literal @}apercova</a>
 * @since 1.2.0
 */
class BasePathProvider {
  constructor() {
    this.priority = 999999999;
    this.id = 'BasePathProvider';
    this.scopeSelector = '*';
    this.fileExtFilter = undefined;
    this._logger = logger.getLogger(this.id);
  }

  /**
   * resolve - Resolve suggestions
   *
   * @param  {object} req Request options
   * @return {object}     Autocomplete suggestions
   */
  resolve(req) {
    throw "Not implemented in base class!";
  }

  /**
   * canResolve - Determines whether this provider can resolve suggestions
   *
   * @param  {object} req Request options
   * @return {object}     {@code true} if this provider can resolve suggestions. {@code false} otherwise
   */
  canResolve(req) {
    return false
  }

  /**
   * activate - Provides a mechanism to initialize provider dependencies
   *
   * @return {promise}     A promise after provider activation
   */
  activate() { }

  /**
   * dispose - Provides a mechanism to release resources before disposing
   *
   *  @return {promise}     A promise after provider disposition
   */
  dispose() { }

  $resolveSearchPathSync(req) {
    const filePath = this.$getCurrentFilePath(req);
    return new SearchPathDTO(filePath, filePath, '');
  }

  $resolveSuggestions(req, search) {
    const self = this;
    const promize = new Promise((resolve, reject) => {
      let result = new SuggestionsDTO(self.$getPrefix(req), [], self.$getCurrentFilePath(req), '');
      if (!(search instanceof SearchPathDTO)) {
        resolve(self.formatter.format(result));
      } else {
        /*Adjust path params*/
        result.searchPath = search.searchPath || result.searchPath;
        result.testPath = search.testPath || result.testPath;
        try {
					fs.readdir(result.searchPath, (err, entries) => {
						if (err) {
              self._logger.warn(err);
            }
            if (Array.isArray(entries)) {
              result.suggestions.push({type: 'dir', entry: '..'});
              entries.forEach((entry) => {
  							let entryStats = fs.statSync(path.resolve(result.searchPath, entry));
  							if (entryStats) {
  								if(entryStats.isFile()){
  									result.suggestions.push({type: 'file', entry: entry});
  								}
  								if(entryStats.isDirectory()){
  									result.suggestions.push({type: 'dir', entry: entry});
  								}
  							}
  						});

              if (Array.isArray(self.fileExtFilter)) {
                self._logger.debug('Filtering files by extension.');
                result.suggestions = result.suggestions
                .filter(s => {
                  return (s.type === 'file')
                        ? self.fileExtFilter.some(ext => ext === path.parse(s.entry).ext)
                        : true;
                });
              }
            }
						resolve(self.formatter.format(result));
					});
				} catch (err) {
          self._logger.warn(err);
          resolve(self.formatter.format(result));
				}
      }
    });
    return promize;
  }

  /**
	 * $getPrefix - Return replacement prefix
	 *
	 * @param  {object} req Request options
	 * @return {string}     Replacement prefix
	 */
  $getPrefix(req){
    const regex = /[^\/]+$/;
    const match = this.$getCurrentLineUpCursor(req).match(regex);
    return match ? match[0] : '';
  }

  /**
   * getCurrentLine - Return current buffer line
   *
   * @param  {object}  req      Request options
   * @param  {boolean} unescape Indicates whether unescape buffer line
   * @return {string}           Current buffer line
   */
  $getCurrentLine(req, unescape) {
    let line = req ? stringUtils.unescapeStringQuote(req.editor.getLastCursor().getCurrentBufferLine()) : '';
    line = unescape ? stringUtils.unescapeStringQuote(line) : line;
    return line;
  }

  /**
   * getCurrentLineUpCursor - Return current buffer line up to cursor position
   *
   * @param  {object}  req      Request options
   * @param  {boolean} unescape Indicates whether unescape buffer line
   * @return {string}           Current buffer line up to cursor position
   */
  $getCurrentLineUpCursor(req, unescape) {
    let line = req ? req.editor.getTextInRange([[req.bufferPosition.row, 0], req.bufferPosition]) : '';
    line = unescape ? stringUtils.unescapeStringQuote(line) : line;
    return line;
  }

  /**
   * getCurrentFilePath - Return current file path
   *
   * @param  {object}  req      Request options
   * @param  {boolean} unescape Indicates whether unescape buffer line
   * @return {string}           Current file path
   */
  $getCurrentFilePath(req, unescape) {
    let filePath = req ? path.parse(req.editor.getPath()).dir : null;
    filePath = unescape ? stringUtils.unescapeStringQuote(filePath) : filePath;
    return filePath;
  }

  /**
   * getCurrentProjectPath - Return current project path
   *
   * @param  {object}  req      Request options
   * @param  {boolean} unescape Indicates whether unescape buffer line
   * @return {string}           Current project path
   */
  $getCurrentProjectPath(req, unescape){
    const filePath = req.editor.getPath();
    let projectPath = atom.project.getDirectories()
    .filter(testpath => filePath.indexOf(testpath.path) > -1 )
    .reduce((found, testpath) => found ? found : testpath.path , false);
    projectPath = unescape ? stringUtils.unescapeStringQuote(projectPath) : projectPath;
    return projectPath;
  }
}
BasePathProvider.id = 'BasePathProvider';
module.exports = BasePathProvider;
