'use babel'
import path from 'path';
import fs from 'fs';
import BasePathProvider from './base-path.provider.js';
import SearchPathDTO from '../../dto/search-path.dto.js';
import SuggestionsDTO from '../../dto/suggestions.dto.js';

export default class CurrentFileRelativePathProvider extends BasePathProvider {

  constructor() {
		super();
		this.id = 'CurrentFileRelativePathProvider';
		this.priority = 9997;
    this._relPathRegex = /(\/|\.\/|\.\.\/)/;
	}
  canResolve(req) {
		return this.$getCurrentLine(req).match(this._relPathRegex) ? true : false;
	}
  resolve(req) {
    const self = this;
    const promize = new Promise((resolve, reject) => {
      let result = new SuggestionsDTO();

      const search = self._resolveValidPathSync(
        self, req,
        this.$getCurrentLine(req)
      );
      console.dir(search);
      if (!search instanceof SearchPathDTO) {
        resolve(result);
      // if (!search) {
      // resolve(result);
      } else {
        console.warn("found path! ==>");
        console.dir(search);
        if (search && search.searchPath) {
          result = new SuggestionsDTO(this.$getPrefix(req, search), []);
          try {
		  fs.readdir(search.searchPath,
            function(e, entries){
              if (e) {
                console.warn(e);
              }
  						result.suggestions.push({type: 'dir', entry: '..'});
  						entries.forEach(function (entry) {
  							try {
                  entryStats = fs.statSync(path.resolve(search.searchPath, entry));
    							if (entryStats) {
    								if(entryStats.isFile()){
    									result.suggestions.push({type: 'file', entry: entry});
    								}
    								if(entryStats.isDirectory()){
    									result.suggestions.push({type: 'dir', entry: entry});
    								}
    							}
                } catch(e) {
                  console.warn(e);
                }
  						});
              /*Natural order suggestions sort*/
  						result.suggestions = result.suggestions
  						.sort((a, b) => (a.entry).localeCompare(b.entry));
  						resolve(result);
  					});
  				} catch (err) {
            console.warn(err);
  					resolve(result);
  				}
  			} else {
  				resolve(result);
  			}
      }

    });
    return promize;
  }
  _resolveValidPathSync($self, req, testPath, searchPath, idx) {
    let basePath = $self.$getCurrentFilePath(req);
    console.dir(`basepath: ${basePath}`);
    idx = !isNaN(idx) ? idx : 0;
    idx ++;
    if (searchPath) {
      return new SearchPathDTO(basePath, searchPath, testPath);
    } else if (!testPath) {
      return false;
    }
    else {
      const matches = testPath.match($self._relPathRegex);
      if (!matches || !matches[0]) {
        return $self._resolveValidPathSync($self, req, undefined, undefined, idx);
      } else {
        testPath = testPath.substring(matches.index);
        console.warn(`trying ${testPath}`);
        if(testPath.startsWith('/')) {
          // Adjust to project relative dir
          basePath = $self.$getCurrentProyectPath(req);
          console.dir(`basepath: ${basePath}`);
        }
        let fullTestPath = path.normalize(`${basePath}/${testPath}`);
        console.dir(fullTestPath);
        // Validating existence as file or directory
        try {
          fs.accessSync(fullTestPath, fs.constants.F_OK);
          console.log(`${fullTestPath} does exist as file or dir`);
          // Does exist, validate if its a file or a dir.
          let stats = fs.statSync(fullTestPath);
          if (!stats.isDirectory()) {
            console.log(`${fullTestPath} is a file`);
            fullTestPath = path.parse(fullTestPath).dir;
            return $self._resolveValidPathSync($self, req, testPath, fullTestPath, idx);
          } else {
            console.log(`${fullTestPath} is a dir`);
            if (testPath.endsWith('/')) {
              return $self._resolveValidPathSync($self, req, testPath, fullTestPath, idx);
            } else {
              /*Fix to allow searching existing directory while not specifying
              * forward slash in order to avoid change back directory when use
              * back directory name (..)
              */
              fullTestPath = path.parse(fullTestPath).dir;
              return $self._resolveValidPathSync($self, req, testPath, fullTestPath, idx);
            }
          }
        } catch(e)
        {
          console.warn(e);
          console.log(`${fullTestPath} does not exist as file nor dir`);
          // testPath does not exists as file nor directory
          // Validating existence of parent directory
          if (!testPath.endsWith('/')) {
              // Prevents searching at parent directory for not found directories
              fullTestPath = path.parse(fullTestPath).dir;
              try {
                fs.accessSync(fullTestPath, fs.constants.F_OK);
                console.log(`${fullTestPath} does exist as parent dir`);
                // Does exists as parent dir, return match
                return $self._resolveValidPathSync($self, req, testPath, fullTestPath, idx);
              } catch (e) {
                console.log(`${fullTestPath} does not exist as parent dir`);
                // Not exists as parent dir, trying next match
                testPath = testPath.substring(matches[0].length);
                return $self._resolveValidPathSync($self, req, testPath, undefined, idx);
              }
          } else {
            // Not exists at all, trying next match
            testPath = testPath.substring(matches[0].length);
            return $self._resolveValidPathSync($self, req, testPath, undefined, idx);
          }
        }
      }
    }
  }
  $getPrefix(req, search){
    const regex = /[^\/]+$/;
    const match = search.testPath.match(regex);
    return match ? match[0] : '';
  }
}
