'use babel'

import path from 'path';
import fs from 'fs';
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
		return this.$resolveSuggestions(req, this.$resolveSearchPathSync(req));
	}

	$resolveSearchPathSync(req) {
		let basePath = `${this.local_node_modules}`.trim();
		let testPath = this._getTestPath(req);
		console.dir(`testPath: ${testPath}`);
		if (`${testPath}`.startsWith('.')) {
			basePath = this.$getCurrentFilePath(req);
		}
		console.dir(`basepath: ${basePath}`);
		let fullTestPath = path.normalize(`${basePath}/${testPath}`);
		console.dir(`fullTestPath: ${fullTestPath}`);

		let searchPath = basePath;
		/* Validating existence as file or directory */
		try {
			fs.accessSync(fullTestPath, fs.constants.F_OK);
			console.log(`${fullTestPath} does exist as file or dir`);
			/* Path does exist, validate if file or dir */
			let stats = fs.statSync(fullTestPath);
			if (!stats.isDirectory()) {
				console.log(`${fullTestPath} is a file`);
				searchPath = path.parse(fullTestPath).dir;
			} else {
				console.log(`${fullTestPath} is a dir`);
				if (testPath.endsWith('/')) {
					searchPath = fullTestPath;
				} else {
					/*
					 * Fix to allow searching existing directory while not specifying
					 * forward slash in order to avoid change back directory when use
					 * back directory name (..)
					 */
					searchPath = path.parse(fullTestPath).dir;
				}
			}
		} catch(e)
		{
			console.warn(e);
			console.log(`${fullTestPath} does not exist as file nor dir`);
			/* testPath neither exists as file nor directory
			 * Validating existence of parent directory */
			if (!testPath.endsWith('/')) {
					/* Prevents searching on parent directory if test path is a directory */
					fullTestPath = path.parse(fullTestPath).dir;
					try {
						fs.accessSync(fullTestPath, fs.constants.F_OK);
						console.log(`${fullTestPath} does exist as parent dir`);
						/* Path exists as parent dir, return match */
						searchPath = fullTestPath;
					} catch (e) {
						console.log(`${fullTestPath} does not exist as parent dir`);
						/* Path does not exist as parent dir, trying next match */
						//testPath = testPath.substring(matches[0].length);
						//return $self.$resolveSearchPathSync($self, req, testPath, undefined, idx);
					}
			} else {
				/* No path exists at all, trying next match */
				//testPath = testPath.substring(matches[0].length);
				//return $self.$resolveSearchPathSync($self, req, testPath, undefined, idx);
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

	_getTestPath(req) {
		const line = this.$getCurrentLine(req);
		const match = this.$getCurrentLine(req).match(this.patternRegex);
    return match ? match[1] : '';
	}

}
