'use babel'

import { File } from 'atom';
import { Directory } from 'atom';
import path from 'path';

const packageName = "atom-path-intellisense";
const pathRegex = /(\.?\.?\/)([A-Za-z0-9\:\.\,\;\'\x60\?\#\@\!\$\&\[\]\(\)\*\+\=\-\_\~\s]+\/)*([A-Za-z0-9\:\.\,\;\'\x60\?\#\@\!\$\&\[\]\(\)\*\+\=\-\_\~\s]+)?$/;
const rtrimRegex = /.*\S$/;
const rplPrefixRegex = /.*\/(.*)$/;
const allScopesRegex = /^\s*\*\s*$/;

module.exports = {
  selector: "*",
  inclusionPriority: 1,
  excludeLowerPriority: false,
  suggestionPriority: 1,
  filterSuggestions: true,
  defaultSettings:function(){
    var ms = atom.config.get(packageName+".manual-suggest");
    if(ms === null || typeof ms === "undefined"){
      atom.config.set(packageName+".manual-suggest", "false");
      ms = atom.config.get(packageName+".manual-suggest");
    }

    var sd = atom.config.get(packageName+".scope-descriptors");
    if(sd === null || typeof sd === "undefined"){
      atom.config.set(packageName+".scope-descriptors", ["string.quoted.single", "string.quoted.double"]);
    }
  },
  getSuggestions: function(req){
    this.defaultSettings();
    if(!this.isScopeDescriptorValid(req.scopeDescriptor)){
      return [];
    }

    var ms = atom.config.get(packageName+".manual-suggest");
    if(ms === "true"){
      if(req.activatedManually === true){
        return this.lookUpEntries(req);
      }
    }else{
      return this.lookUpEntries(req);
    }
  },
  getPrefix:function(req){
    var line, prefix, prefixRegex;
    line = req.editor.getTextInRange([[req.bufferPosition.row, 0], req.bufferPosition]);
    prefix = (prefix = line.match(pathRegex)) !== null ? prefix[0]: "";
    prefix = (prefix = prefix.match(rtrimRegex)) !== null ? prefix[0]: "";
    prefix = prefix.endsWith(".") ? prefix.substring(0, prefix.length-1) : prefix;
    return prefix;
  },
  isScopeDescriptorValid:function(scopeDescriptor){
    var descriptors = atom.config.get(packageName+".scope-descriptors")||["*"];
    var res = false;

    for(var i in descriptors){
      var curr = descriptors[i];
      if(curr.match(allScopesRegex) !== null){
        res = true;
        break;
      }
      var ft = scopeDescriptor.scopes.filter(function(obj){
        return (obj.indexOf(curr) > -1);
      });

      if(ft.length > 0){
        res = true;
        break;
      }
    }
    return res;
  },
  lookUpEntries:function(req){
    var self, prefix, path, sourceDir, files, result;
    self = this;
    prefix = this.getPrefix(req);
    return new Promise(function(resolve){
      result = [];
      path = self.normalizePath(req, prefix);
      if(path.length !== 0){
        result.push(self.formatDirectory(new Directory(".."), prefix, req));
        sourceDir = new Directory(path);
        files = [];
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
  normalizePath:function(req, prefix){
    var file, parent, targetPath;
    file = new File(req.editor.getPath());
    parent = file.getParent();
    targetPath = "";
    if(prefix.startsWith("/")){
      targetPath = this.getProyectRoot(parent.getPath());
    }else if(prefix.startsWith("./") || prefix.startsWith("../")){
      targetPath = parent.getPath();
    }

    if(targetPath.length > 0){
      if(prefix.endsWith("/")){
        file = new Directory(path.normalize( targetPath + path.sep + parent.relativize(prefix) ));
        if(file.existsSync() === true){
          targetPath = file.getPath();
        }else{
          targetPath = "";
        }
      }else{
        //test dir first
        file = new Directory(path.normalize( targetPath + path.sep + parent.relativize(prefix) ));
        if(file.existsSync() === true){
          targetPath = file.getPath() + "/";
        }else{
          file = new File(path.normalize( targetPath + path.sep + parent.relativize(prefix) ));
          if(!file.existsSync() === true){
            targetPath = file.getParent().getPath() + path.sep;
          }else{
            targetPath = "";
          }
        }
      }
    }
    return targetPath;
  },
  getProyectRoot:function(path){
    var root = "";
    var dirs = atom.project.getDirectories();
    if((path||"").length > 0){
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
  formatFile:function(file, prefix, req){
    var rPrefix = ( rPrefix = prefix.match(rplPrefixRegex)) !== null ? rPrefix[1] : req.prefix;
    var item = {
      text:file.getBaseName(),
      type:"snippet",
      rightLabelHTML:'<span class="pi-rlabel file">File</span>'
    };
    if(rPrefix.length > 0){
      item.replacementPrefix = rPrefix
    }
    return item;
  },
  formatDirectory:function(dir, prefix, req){
    var rPrefix = ( rPrefix = prefix.match(rplPrefixRegex)) !== null ? rPrefix[1] : req.prefix;
    var item = {
      text:dir.getBaseName() + "/",
      type:"snippet",
      rightLabelHTML:'<span class="pi-rlabel directory">Directory</span>'
    };
    if(rPrefix.length > 0){
      item.replacementPrefix = rPrefix
    }
    return item;
  }
}
