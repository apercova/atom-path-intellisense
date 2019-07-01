'use babel'
import os from 'os';
import path from 'path';
import fs from 'fs';

const A = "atom-path-intellisense";
const B = "manual-suggest";
const E = /^\s*\*\s*$/;
const F = /(((\/|\.\/|\.\.\/)([^\\\/\:\*\?\"\<\>\|]+\/)*)([^\\\/\:\*\?\"\<\>\|]+)?)$/;
const _a = {
  a: function(){
    return (atom.config.get(`${A}.${B}`) === true);
  },
  b: function(){
    return (atom.config.get(`${A}.${C}`) === true);
  }
};

const _b = {
  a: function(req) {
    let filepath = false;
    let line = this.b(req)||'';
    /*unescape quotes on names*/
    line = this.f(line)
    filepath = line.match(F) || false;
    if (filepath) {
      filepath = {
        path: filepath[1],
        dir: filepath[2],
        file: filepath[5] || ''
      }
    }
    return filepath;
  },
  b: function(req){
    return req.editor.getTextInRange([[req.bufferPosition.row, 0], req.bufferPosition]);
  },
  c:function(req){
    const filepath = req.editor.getPath();
    const projectdir = atom.project.getDirectories()
    .filter(testpath => filepath.indexOf(testpath.path) > -1 )
    .reduce((found, testpath) => found ? found : testpath.path , false);
    return projectdir;
  },
  d: function(req){
    const filepath = req.editor.getPath();
    return path.parse(filepath).dir;
  },
  e: function(req, filepath) {
    const self = this;
    let promize = new Promise(function(resolve, reject){
        let basedir;
        if(filepath.dir.startsWith("/")) {
          /*Project root directory*/
          basedir = self.c(req);
        } else {
          /*Current file directory*/
          basedir = self.d(req);
        }
        /*Make readonly*/
        const basepath = path.normalize(`${basedir}${path.sep}${filepath.path}`);
        let searchpath = false;

        fs.access(basepath, fs.constants.F_OK, (err) => {
          if(!err) {
            /*If base path can be found at filesystem and is a file,
            resolve parent dir path*/
            fs.stat(basepath, function(err, pathstats){
              if(!err){
                if(!pathstats.isDirectory()){
                  searchpath = path.parse(basepath).dir;
                  resolve(searchpath);
                } else {
                  if (basepath.endsWith(path.sep)) {
                    searchpath = basepath;
                    resolve(searchpath);
                  } else {
                    /*Prevents from searching existing directory without specifying
                    * forward slash in order to avoid inner search when having
                    * pattern-like sub directories*/
                    searchpath = path.parse(basepath).dir;
                    resolve(searchpath);
                  }
                }
              } else {
                /*Reading error*/
                reject(e);
              }
            });
          } else {
            /*If base path can not be found at filesystem,
            (ej. incomplete file name) resolve parent dir path only if exists*/
            if (!basepath.endsWith(path.sep)) {
              /*Only resolve for incomplete file names*/
              searchpath = path.parse(basepath).dir
              fs.access(searchpath, fs.constants.F_OK, (err) => {
                if(!err) {
                  resolve(searchpath);
                } else {
                  reject(`Not found: ${basepath}`);
                }
              });
            } else {
              reject(`Not found: ${basepath}`);
            }
          }
        });
    });
    return promize;
  },
  f:function(str){
    str = str.replace(new RegExp(/\\\'/, 'g'), "\'");
    str = str.replace(new RegExp(/\\\"/, 'g'), "\"");
    return str;
  },
  g:function(str){
    str = str.replace(new RegExp(/\'/, 'g'), "\\\'");
    str = str.replace(new RegExp(/\"/, 'g'), "\\\"");
    return str;
  },
  h:function(req, filename, replacement){
    return {
      displayText:this.f(filename),
      text:this.g(filename),
      replacementPrefix: this.g(replacement),
      type:"tag",
      leftLabelHTML:'<span class="pi-rlabel file">File</span>'
    };
  },
  i:function(req, dirname, replacement){
    return {
      displayText: this.f(dirname),
      text: this.g(dirname),
      replacementPrefix: this.g(replacement),
      type:"tag",
      leftLabelHTML:'<span class="pi-rlabel directory">Directory</span>'
    };
  },
  j: function(req){
    const self = this;
    const promize = new Promise(function(resolve, reject){
      let filepath = self.a(req);
      if (filepath) {
        self.e(req, filepath)
        .then(function(searchpath){
          const suggestions = [];
          suggestions.push(self.i(req, "../", filepath.file));
          fs.readdir(searchpath, function(e, entries){
            entries.forEach(function (entry) {
              entryStats = fs.statSync(path.resolve(searchpath, entry));
              if (entryStats) {
                if(entryStats.isDirectory()){
                  suggestions.push(self.i(req,`${entry}/`, filepath.file));
                }
                if(entryStats.isFile()){
                  suggestions.push(self.h(req, entry, filepath.file));
                }
              }
            });
            /*Natural order suggestions sort*/
            suggestions.sort(function(a, b){
              return (a.text).localeCompare(b.text);
            });
            resolve(suggestions);
          });
        })
        .catch(function(e){
          reject(e);
        });
      }
    });
    return promize;
  },
  k:function(req){
    const self = this;
    var promize = new Promise(function(resolve, reject){
      let invoke = false;

      if(!_a.a()){
        invoke = true;
      } else {
        if (req.activatedManually) {
          invoke = true;
        }
      }

      if(invoke) {
        self.j(req)
        .then(function(suggestions){
          resolve(suggestions);
        })
        .catch(function(e){
          console.warn(e);
        });
      }
    });
    return promize;
  }
};

module.exports = {
  selector: ".source .string.quoted, .text",
  disableForSelector: '',
  inclusionPriority: 1,
  excludeLowerPriority: false,
  suggestionPriority: 1,
  filterSuggestions: true,
  k: function(req){
    return _b.k(req);
  }
}
