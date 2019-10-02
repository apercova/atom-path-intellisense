'use babel'

import path from 'path';
import fs from 'fs';
import BasePathProvider from './base-path.provider.js';
import BaseFormatter from '../formatters/base.formatter.js';
import SuggestionsDTO from '../dto/suggestions.dto.js';

export default class NodeJSPathProvider extends BasePathProvider {
	constructor(formatter) {
		super();
		this.id = 'NodeJSPathProvider';
		this.priority = 9991;
		this.scopeSelector = '.source.js .string.quoted';
		this.formatter = formatter instanceof BaseFormatter
										? formatter : new DefaultFormatter();
    this.patternRegex = /require\([\'\"](?<path>.*?)[\'\"]\)/;
		this.relPathRegex = /^(\/|\.\/|\.\.\/)/;

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
						 self.local_node_modules = path.format(path.parse(`${stdout}`));
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
						 self.global_node_modules = path.format(path.parse(`${stdout}`));
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

	resolve(req) {
		const self = this;
		const promize = new Promise((resolve, reject) => {
			const searchPath = self.local_node_modules;
			const result = new SuggestionsDTO(this.$getPrefix(req));
			if (searchPath) {
				try {
					fs.readdir(searchPath,
						   (e, entries) => {
						result.suggestions.push({type: 'dir', entry: '..'});
						entries.forEach((entry) => {
							entryStats = fs.statSync(path.resolve(searchPath, entry));
							if (entryStats) {
								if(entryStats.isFile()){
									result.suggestions.push({type: 'file', entry: entry});
								}
								if(entryStats.isDirectory()){
									result.suggestions.push({type: 'dir', entry: entry});
								}
							}
						});
						resolve(self.formatter.format(result));
					});
				} catch (err) {
					reject(err);
				}
			} else {
				resolve(self.formatter.format(result));
			}
		});
		return promize;
  }
}
