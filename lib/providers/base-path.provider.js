'use babel'

import path from 'path';
import stringUtils from '../util/string-utils.js';

/**
 * Base path provider class
 * @author {@literal @}apercova
 * <a href="https://github.com/apercova" target="_blank">https://github.com/apercova</a>
 * <a href="https://twitter.com/apercova" target="_blank">{@literal @}apercova</a>
 * @since 1.2.0
 */
export default class BasePathProvider {
  constructor() {
    this.priority = 999999999;
    this.id = 'BasePathProvider';
    this.scopeSelector = '*';
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
    throw "Not implemented in base class!";
  }

  /**
   * activate - Provides a mechanism to initialize provider dependencies
   *
   * @return {promise}     A promise after provider activation
   */
  activate() {
    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }

  /**
   * dispose - Provides a mechanism to release resources before disposing
   *
   *  @return {promise}     A promise after provider disposition
   */
  dispose() {
    return new Promise((resolve, reject) => {
      resolve(true);
    });
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