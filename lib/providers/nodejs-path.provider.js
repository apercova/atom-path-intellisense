'use babel'

import path from 'path';
import fs from 'fs';
import mod from 'module';
import BasePathProvider from './base-path.provider.js';
import BaseFormatter from '../formatters/base.formatter.js';
import SuggestionsDTO from '../dto/suggestions.dto.js';
import SearchPathDTO from '../dto/search-path.dto.js';

export default class NodeJSPathProvider extends BasePathProvider {
	constructor(formatter) {
		super();
		this.id = 'NodeJSPathProvider';
		this.priority = 9991;
		this.scopeSelector = '.source.js .string.quoted';
		this.formatter = formatter instanceof BaseFormatter
										? formatter : new DefaultFormatter();
		this.fileExtFilter = ['.js'];
    this.patternRegex = /require\([\'\"](?<path>.*?)[\'\"]\)/;
		this.prefixRegex = /([^\/]+?)$/;
		this.biModRegex = /^[^\.\/].*$/;
		this.biModPrefixRegex = /([^\'\"]+?)$/;
		this.builtinModules = [];
		this.global_node_modules = undefined;
		this.local_node_modules = undefined;
	}

	/**
   * activate - Provides a mechanism to initialize provider dependencies
   *
   * @return {promise}     A promise after provider activation
   */
  activate() {
		let self = this;
    const promize = new Promise((resolve, reject) => {
			try {
				self.builtinModules = mod.builtinModules;
				console.dir(self.builtinModules);
				const { exec } = require('child_process');
				exec('npm root', (err, stdout, stderr) => {
				  if (err) {
				    console.error(err);
				  } else {
				   console.log(`stdout: ${stdout}`);
				   console.log(`stderr: ${stderr}`);
					 try {
						 self.local_node_modules = path.format(path.parse(`${stdout}`.trim()));
						 console.log(`local_node_modules: ${self.local_node_modules}`);
					 } catch(e) {
						 console.warn(e);
					 }
				  }
				});
				exec('npm root -g', (err, stdout, stderr) => {
				  if (err) {
				    console.error(err);
				  } else {
				   console.log(`stdout: ${stdout}`);
				   console.log(`stderr: ${stderr}`);
					 try {
						 self.global_node_modules = path.format(path.parse(`${stdout}`.trim()));
						 console.log(`global_node_modules: ${self.global_node_modules}`);
					 } catch(e) {
						 console.warn(e);
					 }
				  }
				});
				resolve(self);
			} catch(e) {
				console.warn(e);
				reject(e, self);
			}
    });
		return promize;
  }

	canResolve(req) {
    return this.$getCurrentLine(req, true)
					.match(this.patternRegex) ? true : false;
	}

	/**
   * resolve - Resolve suggestions
   *
   * @param  {object} req Request options
   * @return {object}     Autocomplete suggestions
   */
	resolve(req) {
		const self = this;
		return new Promise((resolve, reject) => {
			self.$resolveSuggestions(req, this.$resolveSearchPathSync(req))
			.then((suggestions) => {
				if(this._getTestPath(req).match(this.biModRegex)) {
					const biModSuggestions = self._resolveBuiltInModuleSuggestions(req);
					console.dir(biModSuggestions);
					suggestions = suggestions.concat(biModSuggestions);
				}
				resolve(suggestions);
			})
			.catch(e => reject(e));
		});
	}

	$resolveSearchPathSync(req) {
		let testPath = this._getTestPath(req);
		console.dir(`testPath: ${testPath}`);
		let basePath = `${this.local_node_modules}`.trim();
		if (`${testPath}`.startsWith('.')) {
			basePath = this.$getCurrentFilePath(req);
		}
		console.dir(`basepath: ${basePath}`);
		const fullTestPath = path.normalize(`${basePath}/${testPath}`);
		console.dir(`fullTestPath: ${fullTestPath}`);

		let searchPath = undefined;
		/* Validating existence as file or directory */
		try {
			fs.accessSync(fullTestPath, fs.constants.F_OK);
			console.log(`${fullTestPath} does exist as file or dir`);
			/* Path does exist, validate if file or dir */
			let stats = fs.statSync(fullTestPath);
			if (!stats.isDirectory()) {
				/* Pathis a file, return parent dir*/
				console.log(`${fullTestPath} is a file`);
				searchPath = path.parse(fullTestPath).dir;
			} else {
				/* Pathis a dir, return it*/
				console.log(`${fullTestPath} is a dir`);
				searchPath = fullTestPath;
			}
		} catch(e)
		{
			/* testPath neither exists as file nor directory
			 * Validating existence of parent directory */
			console.warn(e);
			console.log(`${fullTestPath} does not exist as file nor dir`);
			if (!testPath.endsWith('/')) {
					/* Prevents searching on parent directory if test path is a directory */
					searchPath = path.parse(fullTestPath).dir;
					try {
						fs.accessSync(searchPath, fs.constants.F_OK);
						/* Path parent dir exists, return it */
						console.log(`${searchPath} does exist as parent dir`);
					} catch (e) {
						/* Path parent dir does not exist, return fullPath*/
						console.log(`${searchPath} does not exist as parent dir`);
						searchPath = fullTestPath;
					}
			} else {
				/* No path exists at all, return fullPath*/
				console.log('No path exists at all');
				searchPath = fullTestPath;
			}
		}
		return new SearchPathDTO(basePath, searchPath, testPath);
	}

	/**
	 * $getPrefix - Return replacement prefix
	 *
	 * @param  {object} req Request options
	 * @return {string}     Replacement prefix
	 */
  $getPrefix(req){
    const match = this._getTestPath(req).match(this.prefixRegex);
    return match ? match[0] : '';
  }

	$getBiModPrefix(req){
    // const match = this._getTestPath(req).match(this.biModPrefixRegex);
    // return match ? match[0] : '';
		return this._getTestPath(req);
  }

	_getTestPath(req) {
		const line = this.$getCurrentLine(req);
		const match = this.$getCurrentLine(req).match(this.patternRegex);
    return match ? match[1] : '';
	}

	_getBuiltinModules() {
		const modules = ['fs', 'path'];
		return modules;
	}

	_resolveBuiltInModuleSuggestions(req) {
		let result = new SuggestionsDTO(this.$getBiModPrefix(req), [], this.$getCurrentFilePath(req), this._getTestPath(req));
		if(Array.isArray(this.builtinModules)) {
			this.builtinModules
			.forEach(mod => {
				result.suggestions.push({type: 'bimodule', entry: mod});
			});
		}
		return this.formatter.format(result);
	}
}
