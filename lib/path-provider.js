'use babel'
import path from 'path';
import fs from 'fs';

const PACKAGE_NAME = "atom-path-intellisense";
const CFG_MANUAL_SUGGEST = "manual-suggest";
const CFG_ENFORCE_PATH = "enforce-path";
const CFG_SCOPE_DESCRIPTORS = "scope-descriptors";
const CURSOR_PATH_REGEX = /(((\.\.\/|\.\/|\/)?([^\\\/\:\*\?\"\<\>\|]+\/)*)([^\\\/\:\*\?\"\<\>\|]+)?$)/;
const ENFORCE_CURSOR_PATH_REGEX = /(((\.\.\/|\.\/|\/)([^\\\/\:\*\?\"\<\>\|]+\/)*)([^\\\/\:\*\?\"\<\>\|]+)?$)/;
const ALL_SCOPES_REGEX = /^\s*\*\s*$/;

const settings = {
  isManualModeOn: function(){
    return (atom.config.get(`${PACKAGE_NAME}.${CFG_MANUAL_SUGGEST}`) === true);
  },
  ispathEnforcingOn: function(){
    return (atom.config.get(`${PACKAGE_NAME}.${CFG_ENFORCE_PATH}`) === true);
  },
  inAValidScope:function(testScopes){
    testScopes = testScopes||[""];
    const confScopes = atom.config.get(`${PACKAGE_NAME}.${CFG_SCOPE_DESCRIPTORS}`)
    let res = false;
    for(let i = 0; i < confScopes.length; i++){
      if(settings.isInScopes(confScopes[i], testScopes)){
        res = true;
        break;
      }
    }
    return res;
  },
  isInScopes:function(scope, testScopes){
    scope = scope||"*";
    testScopes = testScopes||["*"];
    let res = false;
    for(let i = 0; i < testScopes.length; i++){
      let curr = testScopes[i];
      if(curr.match(ALL_SCOPES_REGEX) !== null){
        res = true;
        break;
      }
      if(curr.indexOf(scope) > -1){
        res = true;
        break;
      }
    }
    return res;
  }
}

const fn = {
  resolvePathSuggestions:function(req){
    const self = this;
    const promize = new Promise(function(resolve){
        const cursorPath = self.getCursorCurrentPath(req);
        const suggestions = [];
        self.resolveSearchPath(req, cursorPath)
        .then(function(searchPath){
          //Fixed parent dir
          suggestions.push(self.formatDirectory("../", req));
          //Seeking searchPath for files and directories/
          const entries = fs.readdirSync(searchPath);
          entries.forEach(function (entry) {
          	try {
              entryStats = fs.statSync(path.normalize(`${searchPath}${path.sep}${entry}`));
              if (entryStats) {
                if(entryStats.isDirectory()){
                  suggestions.push(self.formatDirectory(`${entry}/`, req));
                }
                if(entryStats.isFile()){
                  suggestions.push(self.formatFile(entry, req));
                }
              }
            }
            catch(e) {
              console.warn('unable to read a file entry.');
              console.warn(e);
            }
          });
          /*Natural order suggestions sort*/
          suggestions.sort(function(a, b){
            return (a.text).localeCompare(b.text);
          });
          resolve(suggestions);
        })
        .catch(function(e){
          console.warn(e);
          resolve(suggestions);
        });
    });
    return promize;
  },
  resolveSearchPath: function(req, cursorPath){
    const self = this;
    const promize = new Promise(function(resolve, reject){
      try{
        let basePath;
        if(cursorPath.startsWith("/")){
          /*Proyect base directory*/
          basePath = path.parse(self.getProyectRoot(req.editor.getPath()));
        } else {
          /*Current file directory*/
          basePath = path.parse(path.parse(req.editor.getPath()).dir);
        }
        //Constructs complete path
        let searchPath = path.normalize(`${path.format(basePath)}${path.sep}${cursorPath}`);
        if(fs.existsSync(searchPath)){
          let pathStats = fs.statSync(searchPath);
          if(pathStats && pathStats.isDirectory()){
            resolve(searchPath);
          } else {
            /*If search path can be found at filesystem, but is a file,
            resolve parent dir path*/
            resolve( path.normalize(`${searchPath.dir}${path.sep}`));
          }
        } else {
          /*If search path can not be found at filesystem,
          (ej. incomplete file name) resolve parent dir path*/
          if (!cursorPath.endsWith("/")) {
            /*Only resolve for incomplete file names*/
            searchPath = path.parse(searchPath);
            resolve( path.normalize(`${searchPath.dir}${path.sep}`));
          }
        }
      }
      catch(e){
        /*If search path can not be determined, log warn and try to resolve
        current dir path, otherrwise reject with an error*/
        try {
          const searchPath = path.parse(path.parse(req.editor.getPath()).dir);
          console.warn(`Could not determine absolute path. Resolving to current dir: ${searchPath}`);
          console.warn(e);
          resolve(searchPath);
        }
        catch(e) {
          reject(e);
        }
      }
    });
    return promize;
  },
  getReplacementPrefix:function(req){
    return this.getCursorCurrentFile(req);
  },
  formatFile:function(file, req){
    return {
      displayText:this.unescapeStringQuote(file),
      text:this.escapeStringQuote(file),
      replacementPrefix: this.escapeStringQuote(this.getReplacementPrefix(req)||''),
      type:"tag",
      leftLabelHTML:'<span class="pi-rlabel file">File</span>'
    };
  },
  formatDirectory:function(dir, req){
    return {
      displayText: this.unescapeStringQuote(dir),
      text: this.escapeStringQuote(dir),
      replacementPrefix: this.escapeStringQuote(this.getReplacementPrefix(req)||''),
      type:"tag",
      leftLabelHTML:'<span class="pi-rlabel directory">Directory</span>'
    };
  },
  unescapeStringQuote:function(str){
    str = str.replace(new RegExp(/\\\'/, 'g'), "\'");
    str = str.replace(new RegExp(/\\\"/, 'g'), "\"");
    return str;
  },
  escapeStringQuote:function(str){
    str = str.replace(new RegExp(/\'/, 'g'), "\\\'");
    str = str.replace(new RegExp(/\"/, 'g'), "\\\"");
    return str;
  },
  parseCursorCurrentPath: function(req) {
    let line = this.getCurrentLine(req)||'';
    /*unescape quotes on names*/
    line = this.unescapeStringQuote(line);
    let path = settings.ispathEnforcingOn()
              ? ENFORCE_CURSOR_PATH_REGEX.exec(line)
              : CURSOR_PATH_REGEX.exec(line);
    return path;
  },
  getCurrentLine:function(req){
    return req.editor.getTextInRange([[req.bufferPosition.row, 0], req.bufferPosition]);
  },
  getProyectRoot:function(path){
    path = path||"";
    let root = "./";
    let dirs = atom.project.getDirectories();
    if(path.length > 0){
      for(let i = 0; i < dirs.length; i++){
        let dir = dirs[i];
        if(path.indexOf(dir.path) > -1){
          root = dir.path;
          break;
        }
      }
    }
    return root;
  },
  isCursorInPath: function(req) {
    let path = this.parseCursorCurrentPath(req);
    return path !== null;
  },
  getCursorCurrentPath: function(req) {
    let path = this.parseCursorCurrentPath(req);
    return path !== null? path[1]: null;
  },
  getCursorCurrentDir: function(req) {
    let path = this.parseCursorCurrentPath(req);
    return path !== null? path[2]: null;
  },
  getCursorCurrentFile: function(req) {
    let path = this.parseCursorCurrentPath(req);
    return path !== null? path[5]: null;
  }
};

module.exports = {
  selector: "*",
  inclusionPriority: 1,
  excludeLowerPriority: false,
  suggestionPriority: 1,
  filterSuggestions: true,
  getSuggestions: function(req){
    let suggestions = [];
    //test if current line has a valid pattern for suggestions
    if (fn.isCursorInPath(req)) {
      //test if cursor is in a valid scope (further check for optional scopes in config)
      if(settings.inAValidScope(req.scopeDescriptor.scopes)){
          if(!settings.isManualModeOn()){
            suggestions = fn.resolvePathSuggestions(req);
          } else {
            if (req.activatedManually) {
              suggestions = fn.resolvePathSuggestions(req);
            }
          }
      }
    }
    return suggestions;
  }
}
