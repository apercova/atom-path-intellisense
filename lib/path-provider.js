'use babel'

import { File } from 'atom';
import { Directory } from 'atom';

const packageName = "atom-path-intellisense";
var selectors = require('./selectors');

module.exports = {
  selector: selectors.allowedSelectors.toString(),
  disableForSelector: selectors.disabledSelectors.toString(),
  inclusionPriority: 1,
  excludeLowerPriority: false,
  suggestionPriority: 2,
  filterSuggestions: false,
  config:{
    "manual-suggest":{
      type:"boolean",
      default:false
    }
  },
  getSuggestions: function(req){
    var ms = atom.config.get(packageName+".manual-suggest");
    if(ms === true){
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
    return prefix;
  },
  lookUpEntries:function(req){
    var self, path, sourceDir, result, files, dirs;
    self = this;
    return new Promise(function(resolve){
      path = self.normalizePath(req);
      if(path.length > 0){
        files = [];
        dirs = [];
        sourceDir = new Directory(path);
        sourceDir.getEntries(function(error, entries){
          for(var i in entries){
            var entry = entries[i];
            if(entry.isFile()){
              files.push(self.formatFile(entry));
              files.sort(function(a, b){
                return (a.text||"").localeCompare(b.text||"");
              });
            }
            if(entry.isDirectory()){
              dirs.push(self.formatDirectory(entry));
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
  normalizePath:function(req){
    var prefix, file, parent, targetPath;
    prefix = this.getPrefix(req);
    if(prefix.length > 1){
      file = new File(req.editor.getPath());
      parent = file.getParent();
      targetPath = parent.getPath();
      targetPath = targetPath.endsWith("/") ? targetPath : targetPath + "/";
      targetPath = targetPath + parent.relativize(prefix);
      return targetPath;
    }
    return "";
  },
  formatFile:function(file){
    return {
      text:file.getBaseName(),
      type:"snippet",
      rightLabelHTML:'<span class="pi-rlabel file">File</span>'
    };
  },
  formatDirectory:function(dir){
    return {
      text:dir.getBaseName() + "/",
      type:"snippet",
      rightLabelHTML:'<span class="pi-rlabel directory">Directory</span>'
    };
  }
}
