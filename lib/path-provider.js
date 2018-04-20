'use babel'

import { File } from 'atom';
import { Directory } from 'atom';
import path from 'path';

const packageName = "atom-path-intellisense ";
const pathRegex = /(\.?\.?\/)([A-Za-z0-9\:\.\,\;\'\x60\?\#\@\!\$\&\[\]\(\)\*\+\=\-\_\~\s]+\/)*([A-Za-z0-9\:\.\,\;\'\x60\?\#\@\!\$\&\[\]\(\)\*\+\=\-\_\~\s]+)?$/;
const filenameRegex = /([A-Za-z0-9\:\.\,\;\'\x60\?\#\@\!\$\&\[\]\(\)\*\+\=\-\_\~\s]+)?$/;
const rtrimRegex = /.*\S$/;
const rplPrefixRegex = /.*\/(.*)$/;
const allScopesRegex = /^\s*\*\s*$/;

module.exports = {
  selector: "*",
  inclusionPriority: 3,
  excludeLowerPriority: false,
  suggestionPriority: 3,
  filterSuggestions: true,
  getSuggestions: function(req){
    var res = [];
    if(this.isScopeDescriptorValid(req.scopeDescriptor)){
      var ms = atom.config.get(packageName+".manual-suggest");
      if(ms === true){
        if(req.activatedManually === true){
          res = this.resolvePathEntries(req);
        }
      }else{
        res = this.resolvePathEntries(req);
      }
    }
    return res;
  },
  getPrefix:function(req){
    var line, prefix;
    line = this.getCurrentLine(req).trim();
    //is a path?
    prefix = (prefix = line.match(pathRegex)) !== null ? prefix[0]: "";
    //is a file?
    prefix = prefix.length > 0 ? prefix :
              ( (prefix = line.match(filenameRegex)) !== null ? prefix[0]: "" );
    //req prefix
    prefix = prefix.length > 0 ? prefix : req.prefix;
    return prefix;
  },
  getCurrentLine:function(req){
    return req.editor.getTextInRange([[req.bufferPosition.row, 0], req.bufferPosition]);
  },
  isScopeDescriptorValid:function(descriptor){
    var descriptors, res;
    descriptors = atom.config.get(packageName+".scope-descriptors")||["*"];
    res = false;
    for(var i in descriptors){
      var curr = descriptors[i];
      if(curr.match(allScopesRegex) !== null){
        res = true;
        break;
      }
      var ft = descriptor.scopes.filter(function(obj){
        return (obj.indexOf(curr) > -1);
      });

      if(ft.length > 0){
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
      var searchPath = self.resolveSearchPath(req, prefix);
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
  },
  resolveSearchPath:function(req, prefix){
    var file = new File(req.editor.getPath());
    var parent = file.getParent();
    var basePath = "";
    if(prefix.startsWith("/")){
      basePath = this.resolveProyectRoot(parent.getPath());
    }else{
      basePath = parent.getPath();
    }

    if(basePath.length > 0){
      basePath = path.normalize( basePath +
                    path.sep + parent.relativize(prefix) );

      if(prefix.endsWith("/")){
        file = new Directory(basePath);
        basePath = file.existsSync() === true ? file.getPath() : "";
      }else{
        //test dir first
        file = new Directory(basePath);
        if(file.existsSync() === true){
          basePath = file.getPath() + path.sep;
        }else{
          file = new File(basePath);
          basePath = !file.existsSync() === true ?
                        file.getParent().getPath() + path.sep : "";
        }
      }
    }
    return basePath;
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
    var rPrefix = (rPrefix = prefix.match(rplPrefixRegex)) !== null ?
                  rPrefix[1] : prefix;
    return rPrefix;
  },
  formatFile:function(file, prefix, req){
    return {
      text:file.getBaseName(),
      replacementPrefix: this.resolveReplacementPrefix(prefix, req),
      type:"snippet",
      rightLabelHTML:'<span class="pi-rlabel file">File</span>'
    };
  },
  formatDirectory:function(dir, prefix, req){
    return {
      text:dir.getBaseName() + "/",
      replacementPrefix: this.resolveReplacementPrefix(prefix, req),
      type:"snippet",
      rightLabelHTML:'<span class="pi-rlabel directory">Directory</span>'
    };
  }
}
