'use babel'

import { File } from 'atom';
import { Directory } from 'atom';
import path from 'path';
import fs from 'fs';

const packageName = "atom-path-intellisense";
const manualSuggest = "manual-suggest";
const scopeDescriptors = "scope-descriptors";
const pathRegex = /(\.?\.?\/?)([^\\\:\*\?\"\<\>\|]+\/)*([^\\\/\:\*\?\"\<\>\|]+)?$/;
const pathSQRegex = /(\.?\.?\/?)(([^\\\:\*\?\'\"\<\>\|]|(\\\')|(\\\"))+\/)*(([^\\\/\:\*\?\'\"\<\>\|]|(\\\')|(\\\"))+)?$/;
const pathReplacePrefixRegex = /.*\/(\S*)$/;
const allScopesRegex = /^\s*\*\s*$/;

const fn = {
  resolvePathEntries:function(req){
    var self = this;
    return new Promise(function(resolve){
      var dirs = [];
      var files = [];
      var prefix = self.getPrefix(req);
      self.resolveSearchPath(req, prefix)
      .then(function(searchPath){
        dirs.push(self.formatDirectory("..", prefix, req));
        var entries = fs.readdirSync(searchPath);
        var stats;
        for(var i = 0; i < entries.length; i++){
          var entry = entries[i];
          try{
            stats = fs.statSync(path.normalize(searchPath + path.sep + entry));
            if(stats){
              if(stats.isDirectory()){
                dirs.push(self.formatDirectory(entry, prefix, req));
              }
              if(stats.isFile()){
                files.push(self.formatFile(entry, prefix, req));
              }
            }
          }catch(e){
            //Ex. unable to read a file
            console.warn(e);
          }
        }
        files = dirs.concat(files);
        files.sort(function(a, b){
          return (a.text).localeCompare(b.text);
        });
        console.dir(files);
        resolve(files);
      })
      .catch(function(e){
        console.warn(e);
        resolve(files);
      });
    });
  },
  resolveSearchPath:function(req, prefix){
    var self = this;
    return new Promise(function(resolve, reject){
      try{
        var srcPath;
        if(prefix.startsWith("/")){
          srcPath = path.parse(self.getProyectRoot(req.editor.getPath()));
        }else{
          srcPath = path.parse(path.parse(req.editor.getPath()).dir);
        }
        //Constructs complete path
        srcPath = path.normalize(path.format(srcPath) + path.sep + prefix);
        if(fs.existsSync(srcPath)){
          var stats = fs.statSync(srcPath)
          if(stats && stats.isDirectory()){
            resolve(srcPath);
          }
        }else{
          srcPath = path.parse(srcPath);
          resolve(srcPath.dir + path.sep);
        }
      }catch(e){
        reject(e);
      }
    });
  },
  getPrefix:function(req){
    var line = this.getCurrentLine(req);
    var prefix = "";
    //is it a path?
    if(this.isInScopes("string.quoted.single", req.scopeDescriptor.scopes)){
      prefix = (prefix = line.match(pathSQRegex)) !== null ? prefix[0]: "";
    }else{
      prefix = (prefix = line.match(pathRegex)) !== null ? prefix[0]: "";
    }
    prefix = prefix.length > 0 ? prefix : req.prefix;
    prefix = this.unEscapeSingleQuotedText(prefix, req);
    return prefix;
  },
  getReplacementPrefix:function(prefix, req){
    var rPrefix = (rPrefix = prefix.match(pathReplacePrefixRegex)) !== null ?
                  rPrefix[1] : prefix.trim();
    return rPrefix;
  },
  getCurrentLine:function(req){
    return req.editor.getTextInRange([
      [req.bufferPosition.row, 0], req.bufferPosition]);
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
  formatFile:function(file, prefix, req){
    return {
      displayText:file,
      text:this.escapeSingleQuotedText(file, req),
      replacementPrefix: this.escapeSingleQuotedText(this.getReplacementPrefix(prefix, req), req),
      type:"tag",
      leftLabelHTML:'<span class="pi-rlabel file">File</span>'
    };
  },
  formatDirectory:function(dir, prefix, req){
    return {
      displayText:dir + "/",
      text:this.escapeSingleQuotedText(dir, req) + "/",
      replacementPrefix: this.escapeSingleQuotedText(this.getReplacementPrefix(prefix, req), req),
      type:"tag",
      leftLabelHTML:'<span class="pi-rlabel directory">Directory</span>'
    };
  },
  replaceAll:function(str, test, replace) {
    return str.replace(new RegExp(test, 'g'), replace);
  },
  escapeSingleQuotedText:function(text, req){
    return this.isInScopes("string.quoted.single", req.scopeDescriptor.scopes) ?
            this.escapeString(text) : text;
  },
  unEscapeSingleQuotedText:function(text, req){
    return this.isInScopes("string.quoted.single", req.scopeDescriptor.scopes) ?
            this.unescapeString(text) : text;
  },
  unescapeString:function(str){
    str = str.replace(new RegExp(/\\\\/, 'g'), "\\");
    str = str.replace(new RegExp(/\\\'/, 'g'), "\'");
    str = str.replace(new RegExp(/\\\"/, 'g'), "\"");
    return str;
  },
  escapeString:function(str){
  	str = str.replace(new RegExp(/\\/, 'g'), "\\\\");
    str = str.replace(new RegExp(/\'/, 'g'), "\\\'");
    str = str.replace(new RegExp(/\"/, 'g'), "\\\"");
  	return str;
  }
};

module.exports = {
  selector: "*",
  inclusionPriority: 2,
  excludeLowerPriority: false,
  suggestionPriority: 2,
  filterSuggestions: true,
  getSuggestions: function(req){
    var res = [];
    if(fn.inAValidScope(req.scopeDescriptor.scopes)){
      var ms = atom.config.get(packageName + "." + manualSuggest);
      if(ms === true){
        if(req.activatedManually === true){
          res = fn.resolvePathEntries(req);
        }
      }else{
        res = fn.resolvePathEntries(req);
      }
    }
    return res;
  }
}
