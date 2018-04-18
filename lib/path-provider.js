'use babel'

import { File } from 'atom';
import { Directory } from 'atom';
import path from 'path';
var selectors = require('./selectors');

const packageName = "atom-path-intellisense";


module.exports = {
  selector: selectors.allowedSelectors.toString(),
  disableForSelector: selectors.disabledSelectors.toString(),
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
    if(prefix.endsWith(".")){
      prefix = prefix.substring(0, prefix.length-1);
    }
    return prefix;
  },
  lookUpEntries:function(req){
    var self, prefix, path, sourceDir, result, files, dirs;
    self = this;
    prefix = this.getPrefix(req);
    return new Promise(function(resolve){
      path = self.normalizePath(req, prefix);
      if(path.length > 0){
        files = [];
        dirs = [];
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
              dirs.push(self.formatDirectory(entry, prefix));
              dirs.sort(function(a, b){
                return (a.text||"").localeCompare(b.text||"");
              });
            }
          }
          //Listing directories first
          files = dirs.concat(files);
          if(files.length > 0){
            result = [];
            result.push(self.formatDirectory(new Directory("..")));
            result = result.concat(files);
          }
          resolve(result);
        });
      }
    });
  },
  normalizePath:function(req, prefix){
    var file, parent, targetPath;
    file = new File(req.editor.getPath());
    if(prefix.length > 1){
      //Current file relative-directory path
      parent = file.getParent();
      targetPath = path.normalize( parent.getPath() + path.sep + parent.relativize(prefix) );
      if(prefix.endsWith("/")){
        return targetPath;
      }else{
        targetPath = new File(targetPath);
        return targetPath.getParent().getPath() + path.sep;
      }
    }
    else{
      //Just current directory path
      return file.getParent().getPath();
    }
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
