'use babel'
import path from 'path';
import fs from 'fs';

const packageName = "atom-path-intellisense";
const manualSuggest = "manual-suggest";
const scopeDescriptors = "scope-descriptors";
const cursorPathRegex = /(((\.\.\/|\.\/|\/)([^\\\/\:\*\?\"\<\>\|]+\/)*)([^\\\/\:\*\?\"\<\>\|]+)?$)/;
const allScopesRegex = /^\s*\*\s*$/;

const fn = {
  resolvePathSuggestions:function(req){
    const self = this;
    const promize = new Promise(function(resolve){
        const cursorPath = self.getCursorCurrentPath(req);
        const suggestions = [];
        self.resolveSearchPath(req, cursorPath)
        .then(function(searchPath){
          //Fixed parent dir
          suggestions.push(self.formatDirectory("..", req));
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
              console.warn('unable to read a file entry');
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
  unescapeStringSpace:function(str){
    str = str.replace(new RegExp(/\%20/, 'g'), " ");
    return str;
  },
  escapeStringSpace:function(str){
    str = str.replace(new RegExp(/\s/, 'g'), "\%20");
    return str;
  },
  parseCursorCurrentPath: function(req) {
    let line = this.getCurrentLine(req)||'';
    /*unescape quotes on names*/
    line = this.unescapeStringQuote(line);
    /*escape spaces on names for regexp detection*/
    //line = this.escapeStringSpace(line);
    let path = cursorPathRegex.exec(line);
    /*if (path) {
      //unescape spaces in names abter regexp detection
      if(path[0]) { path[0] = this.unescapeStringSpace(path[0]); }
      if(path[1]) { path[1] = this.unescapeStringSpace(path[1]); }
      if(path[2]) { path[2] = this.unescapeStringSpace(path[2]); }
      if(path[3]) { path[3] = this.unescapeStringSpace(path[3]); }
      if(path[4]) { path[4] = this.unescapeStringSpace(path[4]); }
      if(path[5]) { path[5] = this.unescapeStringSpace(path[5]); }
    }*/
    return path;
  },
  getCurrentLine:function(req){
    return req.editor.getTextInRange([[req.bufferPosition.row, 0], req.bufferPosition]);
  },
  getProyectRoot:function(path){
    var path = path||"";
    var root = "./";
    var dirs = atom.project.getDirectories();
    if(path.length > 0){
      for(var i = 0; i < dirs.length; i++){
        var dir = dirs[i];
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
  },
  isInScopes:function(scope, testScopes){
    scope = scope||"*";
    testScopes = testScopes||["*"];
    var res = false;
    for(var i = 0; i < testScopes.length; i++){
      var curr = testScopes[i];
      if(curr.match(allScopesRegex) !== null){
        res = true;
        break;
      }
      if(curr.indexOf(scope) > -1){
        res = true;
        break;
      }
    }
    return res;
  },
  inAValidScope:function(testScopes){
    testScopes = testScopes||[""];
    var confScopes = atom.config.get(packageName + "." + scopeDescriptors);
    var res = false;
    for(var i = 0; i < confScopes.length; i++){
      if(this.isInScopes(confScopes[i], testScopes)){
        res = true;
        break;
      }
    }
    return res;
  },
  isManualModeOn: function(){
    return (atom.config.get(packageName + "." + manualSuggest) === true);
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
      if(fn.inAValidScope(req.scopeDescriptor.scopes)){
          if(!fn.isManualModeOn()){
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
