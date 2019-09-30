'use babel'

import path from 'path';
import stringUtils from '../util/string-utils.js';

export default class BasePathProvider {
  constructor() {
    this.priority = 999999999;
    this.id = 'BasePathProvider';
    this.scopeSelector = '*';
  }
  resolve(req) {
    throw "Not implemented in base class!";
  }
  canResolve(req) {
    throw "Not implemented in base class!";
  }
  dispose() {
    throw "Not implemented in base class!";
  }

  /*Returns prefix for non-spaced words*/
  $getPrefix(req){
    //const regex = /[^\'\"\/\s]+$/;
    const regex = /[^\/]+$/;
    const match = this.$getCurrentLineUpCursor(req).match(regex);
    return match ? match[0] : '';
  }
  /*Current buffer line*/
  $getCurrentLine(req, unescape) {
    let line = req ? stringUtils.unescapeStringQuote(  req.editor.editor.getLastCursor().getCurrentBufferLine()) : '';
    if (unescape) {
        line = stringUtils.unescapeStringQuote(line);
    }
    return line;
  }
  /*Current buffer line up to cursor position*/
  $getCurrentLineUpCursor(req) {
    return req ? stringUtils.unescapeStringQuote(req.editor.getTextInRange([[req.bufferPosition.row, 0], req.bufferPosition])) : '';
  }
  /*Current file directory*/
  $getCurrentFilePath(req) {
    return req ? stringUtils.unescapeStringQuote(path.format(path.parse(path.parse(req.editor.getPath()).dir))) : null;
  }
  $getCurrentProyectPath(req){
    const filepath = req.editor.getPath();
    const projectdir = atom.project.getDirectories()
    .filter(testpath => filepath.indexOf(testpath.path) > -1 )
    .reduce((found, testpath) => found ? found : testpath.path , false);
    return stringUtils.unescapeStringQuote(projectdir);
  }
}
