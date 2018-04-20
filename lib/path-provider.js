'use babel'

import { File } from 'atom';
import { Directory } from 'atom';
import path from 'path';

const packageName = "atom-path-intellisense";
const manualSuggest = "manual-suggest";
const scopeDescriptors = "scope-descriptors";
const pathRegex = /(\.?\.?\/?)([^\\\:\*\?\"\<\>\|]+\/)*([^\\\/\:\*\?\"\<\>\|]+)?$/;
const pathSQRegex = /(\.?\.?\/?)(([^\\\:\*\?\'\"\<\>\|]|(\\\')|(\\\"))+\/)*(([^\\\/\:\*\?\'\"\<\>\|]|(\\\')|(\\\"))+)?$/;
const pathReplacePrefixRegex = /.*\/(\S*)$/;
const allScopesRegex = /^\s*\*\s*$/;

const fn = {
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
  getCurrentLine:function(req){
    return req.editor.getTextInRange([[req.bufferPosition.row, 0], req.bufferPosition]);
  },
  isInScopes:function(scope, testScopes){
    scope = scope||"*";
    testScopes = testScopes||["*"];
    var res = false;
    for(var i in testScopes){
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
    for(var i in confScopes){
      if(this.isInScopes(confScopes[i], testScopes)){
        res = true;
        break;
      }
    }
    return res;
  },
  resolvePathEntries:function(req){
    var self = this;
    return new Promise(function(resolve){
      var result = [];
      var prefix = self.getPrefix(req);
      self.resolveSearchPath(req, prefix).then(function(searchPath){
        if(searchPath.length !== 0){
          result.push(self.formatDirectory(new Directory(".."), prefix, req));
          var sourceDir = new Directory(searchPath);
          var files = [];
          sourceDir.getEntries(function(error, entries){
            for(var i in entries){
              var entry = entries[i];
              if(entry.isFile()){
                files.push(self.formatFile(entry, prefix, req));
                files.sort(function(a, b){
                  return (a.text||"").localeCompare(b.text||"");
                });
              }
              if(entry.isDirectory()){
                result.push(self.formatDirectory(entry, prefix, req));
                result.sort(function(a, b){
                  return (a.text||"").localeCompare(b.text||"");
                });
              }
            }
            //Listing directories first
            result = result.concat(files);
            resolve(result);
          });
        }
      });
    });
  },
  resolveSearchPath:function(req, prefix){
    var self = this;
    return new Promise(function(resolve){
      var file = new File(req.editor.getPath());
      var parent = file.getParent();
      var basePath = "";
      if(prefix.startsWith("/")){
        basePath = self.resolveProyectRoot(parent.getPath());
      }else {
        basePath = parent.getPath();
      }
      if(basePath.length > 0){
        basePath = path.normalize( basePath +
                      path.sep + parent.relativize(prefix) );
        file = new Directory(basePath);
        file.exists().then(function(res){
          if(res===true){
            basePath = file.getPath() + path.sep;
            resolve(basePath);
          }else{
            file = new File(basePath);
            file.exists().then(function(res2){
              basePath = res2 !== true ?
                            file.getParent().getPath() + path.sep: "";
              resolve(basePath);
            });
          }
        });
      }
    });
  },
  resolveProyectRoot:function(path){
    var path = path||"";
    var root = "./";
    var dirs = atom.project.getDirectories();
    if(path.length > 0){
      for(var i in dirs){
        var dir = dirs[i];
        if(path.indexOf(dir.path) > -1){
          root = dir.path;
          break;
        }
      }
    }
    return root;
  },
  resolveReplacementPrefix:function(prefix, req){
    var rPrefix = (rPrefix = prefix.match(pathReplacePrefixRegex)) !== null ?
                  rPrefix[1] : prefix.trim();
    return rPrefix;
  },
  formatFile:function(file, prefix, req){
    return {
      displayText:file.getBaseName(),
      text:this.escapeSingleQuotedText(file.getBaseName(), req),
      replacementPrefix: this.escapeSingleQuotedText(this.resolveReplacementPrefix(prefix, req), req),
      type:"snippet",
      rightLabelHTML:'<span class="pi-rlabel file">File</span>'
    };
  },
  formatDirectory:function(dir, prefix, req){
    return {
      displayText:dir.getBaseName() + "/",
      text:this.escapeSingleQuotedText(dir.getBaseName(), req) + "/",
      replacementPrefix: this.escapeSingleQuotedText(this.resolveReplacementPrefix(prefix, req), req),
      type:"snippet",
      rightLabelHTML:'<span class="pi-rlabel directory">Directory</span>'
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
