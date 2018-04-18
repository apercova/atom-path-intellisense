'use babel'

import { File } from 'atom';
import { Directory } from 'atom';
import path from 'path';

const packageName = "atom-path-intellisense";

module.exports = {
  selector: "* ",
  inclusionPriority: 0,
  excludeLowerPriority: false,
  suggestionPriority: 0,
  filterSuggestions: true,
  getSuggestions: function(req){
    var ms = atom.config.get(packageName+".manual-suggest");
    //Setting manual-suggest activated for the very first time
    if(ms === null || typeof ms === "undefined"){
      atom.config.set(packageName+".manual-suggest", "false");
      ms = atom.config.get(packageName+".manual-suggest");
    }

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
    prefixRegex = /(\.?\.?\/)([A-Za-z0-9\:\.\,\;\'\x60\?\#\@\!\$\&\[\]\(\)\*\+\=\-\_\~\s]+\/)*([A-Za-z0-9\:\.\,\;\'\x60\?\#\@\!\$\&\[\]\(\)\*\+\=\-\_\~\s]+)?$/;
    line = req.editor.getTextInRange([[req.bufferPosition.row, 0], req.bufferPosition]);
    prefix = (prefix = line.match(prefixRegex)) != null ? prefix[0]: "";
    prefix = prefix.endsWith(".") ? prefix.substring(0, prefix.length-1) : prefix;
    return prefix;
  },
  lookUpEntries:function(req){
    var self, prefix, path, sourceDir, result, files, dirs;
    self = this;
    prefix = this.getPrefix(req);
    return new Promise(function(resolve){
      path = self.normalizePath(req, prefix);
      files = [];
      dirs = [];
      result = [];
      if(path.length !== 0){
        result.push(self.formatDirectory(new Directory("..")));
        sourceDir = new Directory(path);
        sourceDir.getEntries(function(error, entries){
          for(var i in entries){
            var entry = entries[i];
            if(entry.isFile()){
              files.push(self.formatFile(entry, prefix));
              files.sort(function(a, b){
                return (a.text||"").localeCompare(b.text||"");
              });
            }
            if(entry.isDirectory()){
              result.push(self.formatDirectory(entry, prefix));
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

    if(prefix.startsWith("./") || prefix.startsWith("../")){
      targetPath = path.normalize( parent.getPath() + path.sep + parent.relativize(prefix) );
      targetPath = new File(targetPath);
      return prefix.endsWith("/") ?
              targetPath.getPath() :
              targetPath.getParent().getPath() + path.sep;

    }else if(prefix.startsWith("/")){
      //Workspace relative location
      return this.getProyectRoot(parent.getPath());
    }else{
      return "";
    }
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
  formatFile:function(file, prefix){
    return {
      text:file.getBaseName(),
      type:"snippet",
      rightLabelHTML:'<span class="pi-rlabel file">File</span>'
    };
  },
  formatDirectory:function(dir, prefix){
    return {
      text:dir.getBaseName() + "/",
      type:"snippet",
      rightLabelHTML:'<span class="pi-rlabel directory">Directory</span>'
    };
  }
}
