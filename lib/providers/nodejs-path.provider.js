const path = require('path');
const fs = require('fs');
const mod = require('module');
const winston = require('winston');
const logger = require('../util/logger');
const BasePathProvider = require('./base-path.provider');
const BaseFormatter = require('../formatters/base.formatter');
const SuggestionsDTO = require('../dto/suggestions.dto');
const SearchPathDTO = require('../dto/search-path.dto');

class NodeJSPathProvider extends BasePathProvider {
	constructor(formatter) {
		super();
		this.id = 'NodeJSPathProvider';
		this.priority = 9991;
		this.scopeSelector = '.source.js .string.quoted';
		this.formatter = formatter instanceof BaseFormatter
										? formatter : new DefaultFormatter();
		this.fileExtFilter = ['.js'];
		this.builtinModules = [];
		this.global_node_modules = undefined;
		this.local_node_modules = undefined;
		this.requirePatternRegex = /require\([\'\"](?<path>.*?)[\'\"]\)/;
		this.importPatternRegex = /import.*?from.*?[\'\"](?<path>.*?)[\'\"]/;
		this.prefixRegex = /([^\/]+?)$/;
		this.biModRegex = /^[^\.\/].*$/;
		this.biModPrefixRegex = /([^\'\"]+?)$/;
		this._logger = logger.getLogger(this.id);
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
				const { exec } = require('child_process');
				exec('npm root', (err, stdout, stderr) => {
				  if (err) {
				    self._logger.warn(err);
				  } else {
				   self._logger.debug(`npm root stdout: ${stdout}`);
					 if (stderr) {
						 self._logger.warn(`npm root stderr:`);
						 self._logger.warn(stderr);
					 }
					 try {
						 self.local_node_modules = path.format(path.parse(`${stdout}`.trim()));
						 self._logger.debug(`Local node_modules path: ${self.local_node_modules}`);
					 } catch(e) {
						 self._logger.warn(e);
					 }
				  }
				});
				/* TODO: Decide if resolve from global node modules
				exec('npm root -g', (err, stdout, stderr) => {
				  if (err) {
				    self._logger.warn(err);
				  } else {
				   self._logger.debug(`npm root -g stdout: ${stdout}`);
					 if (stderr) {
						 self._logger.warn(`npm root -g stderr:`);
						 self._logger.warn(stderr);
					 }
					 try {
						 self.global_node_modules = path.format(path.parse(`${stdout}`.trim()));
						 self._logger.debug(`Global node_modules path: ${self.global_node_modules}`);
					 } catch(e) {
						 self._logger.warn(e);
					 }
				  }
				});*/
				resolve(self);
			} catch(e) {
				self._logger.warn(e);
				reject(e, self);
			}
    });
		return promize;
  }

	canResolve(req) {
		const line = this.$getCurrentLine(req, true);
		if (line.match(this.requirePatternRegex)) {
			return true;
		}
		let match = line.match(this.importPatternRegex);
		if (match && match[1]) {
			return match[1].match(this.biModRegex)? true: false;
		}
		return false;
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
					suggestions = suggestions.concat(biModSuggestions);
				}
				resolve(suggestions);
			})
			.catch(e => {
				self._logger.warn(e);
				reject(e)
			});
		});
	}

	$resolveSearchPathSync(req) {
		let testPath = this._getTestPath(req);
		this._logger.debug(`testPath: ${testPath}`);
		let basePath = `${this.local_node_modules}`.trim();
		if (`${testPath}`.startsWith('.')) {
			basePath = this.$getCurrentFilePath(req);
		}
		this._logger.debug(`basepath: ${basePath}`);
		const fullTestPath = path.normalize(`${basePath}/${testPath}`);
		this._logger.debug(`fullTestPath: ${fullTestPath}`);

		let searchPath = undefined;
		/* Validating existence as file or directory */
		try {
			fs.accessSync(fullTestPath, fs.constants.F_OK);
			this._logger.debug(`${fullTestPath} does exist as file or dir`);
			/* Path does exist, validate if file or dir */
			let stats = fs.statSync(fullTestPath);
			if (!stats.isDirectory()) {
				/* Pathis a file, return parent dir*/
				this._logger.debug(`${fullTestPath} is a file`);
				searchPath = path.parse(fullTestPath).dir;
			} else {
				/* Pathis a dir, return it*/
				this._logger.debug(`${fullTestPath} is a dir`);
				searchPath = fullTestPath;
			}
		} catch(e)
		{
			/* testPath neither exists as file nor directory
			 * Validating existence of parent directory */
			this._logger.warn(e);
			this._logger.debug(`${fullTestPath} does not exist as file nor dir`);
			if (!testPath.endsWith('/')) {
					/* Prevents searching on parent directory if test path is a directory */
					searchPath = path.parse(fullTestPath).dir;
					try {
						fs.accessSync(searchPath, fs.constants.F_OK);
						/* Path parent dir exists, return it */
						this._logger.debug(`${searchPath} does exist as parent dir`);
					} catch (e) {
						/* Path parent dir does not exist, return fullPath*/
						this._logger.debug(`${searchPath} does not exist as parent dir`);
						searchPath = fullTestPath;
					}
			} else {
				/* No path exists at all, return fullPath*/
				this._logger.debug('No path exists at all');
				searchPath = fullTestPath;
			}
		}
		return new SearchPathDTO(basePath, searchPath, testPath);
	}

	/**
	 * $getPrefix - Return replacement prefix
	 *
	 * @param  {object}        req    Request options
   * @param  {SearchPathDTO} search Search options
	 * @return {string}               Replacement prefix
	 */
  $getPrefix(req){
    const match = this._getTestPath(req).match(this.prefixRegex);
    return match ? match[0] : '';
  }

	$getBiModPrefix(req){
		return this._getTestPath(req);
  }

	_getTestPath(req) {
		const line = this.$getCurrentLine(req);
		let match = false;
		return (match = line.match(this.requirePatternRegex))
		? match[1] : (match = line.match(this.importPatternRegex))
		? match[1]: undefined;
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

	/**
   * dispose - Provides a mechanism to release resources before disposing
   *
   * @return {void}
   */
  dispose() {
		this._logger.debug(`Disposing path provider: ${this.id}`);
		winston.loggers.close(this.id);
		this.formatter = null;
  }
}
NodeJSPathProvider.id = 'NodeJSPathProvider';
module.exports = NodeJSPathProvider;
