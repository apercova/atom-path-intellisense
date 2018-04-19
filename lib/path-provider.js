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
  inclusionPriority: 3,
  excludeLowerPriority: false,
  suggestionPriority: 3,
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
    var res = [];
    this.defaultSettings();
    if(this.isScopeDescriptorValid(req.scopeDescriptor)){
      var ms = atom.config.get(packageName+".manual-suggest");
      if(ms === "true"){
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
    var line, prefix, prefixRegex;
    line = req.editor.getTextInRange([[req.bufferPosition.row, 0], req.bufferPosition]);
    prefix = (prefix = line.match(pathRegex)) !== null ? prefix[0]: "";
    prefix = (prefix = prefix.match(rtrimRegex)) !== null ? prefix[0]: "";
    prefix = prefix.endsWith(".") ? prefix.substring(0, prefix.length-1) : prefix;
    return prefix;
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
    var self, prefix, path, sourceDir, files, result;
    self = this;
    return new Promise(function(resolve){
      result = [];
      prefix = self.getPrefix(req);
      path = self.resolveSearchPath(req, prefix);
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
  resolveSearchPath:function(req, prefix){
    var file, parent, searchPath;
    file = new File(req.editor.getPath());
    parent = file.getParent();
    searchPath = "";
    if(prefix.startsWith("/")){
      searchPath = this.resolveProyectRoot(parent.getPath());
    }else if(prefix.startsWith("./") || prefix.startsWith("../")){
      searchPath = parent.getPath();
    }else{
      searchPath = parent.getPath();
    }

    if(searchPath.length > 0){
      searchPath = path.normalize( searchPath +
                    path.sep + parent.relativize(prefix) );

      if(prefix.endsWith("/")){
        file = new Directory(searchPath);
        searchPath = file.existsSync() === true ? file.getPath() : "";
      }else{
        //test dir first
        file = new Directory(searchPath);
        if(file.existsSync() === true){
          searchPath = file.getPath() + path.sep;
        }else{
          file = new File(searchPath);
          searchPath = !file.existsSync() === true ?
                        file.getParent().getPath() + path.sep : "";
        }
      }
    }
    return searchPath;
  },
  resolveProyectRoot:function(path){
    var root, dirs;
    path = path||"";
    root = "./";
    dirs = atom.project.getDirectories();
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
  formatFile:function(file, prefix, req){
    var rPrefix = ( rPrefix = prefix.match(rplPrefixRegex)) !== null ? rPrefix[1] : req.prefix;
    return {
      text:file.getBaseName(),
      replacementPrefix: rPrefix,
      type:"snippet",
      rightLabelHTML:'<span class="pi-rlabel file">File</span>'
    };
  },
  formatDirectory:function(dir, prefix, req){
    var rPrefix = ( rPrefix = prefix.match(rplPrefixRegex)) !== null ?
                    rPrefix[1] : req.prefix;
    return {
      text:dir.getBaseName() + "/",
      replacementPrefix: rPrefix,
      type:"snippet",
      rightLabelHTML:'<span class="pi-rlabel directory">Directory</span>'
    };
  }
}
