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
	}

	canResolve(req) {
    return this.$getCurrentLine(req, true)
					.match(this.patternRegex) ? true : false;
	}

	_getTestPath(req) {
		let testPath = '';
		const matches =  this.$getCurrentLine(req, true).match(patternRegex);
		console.dir(matches);
		if (matches.groups && matches.groups.path) {
			testPath = matches.groups.path;
			console.log(testPath);
		}
		return testpath;
	}

	_resolveSearchPath(req) {
		const testPath = this._getTestPath(req);
		if (!testpath.match(this.relPathRegex)) {
			//Not a relative path, search accross node_modules directories as of
			// https://adrianmejia.com/getting-started-with-node-js-modules-require-exports-imports-npm-and-beyond/
		} else {
			// Relative path regex, think on solve with other provider first
		}
	}

	resolve(req) {
		const self = this;
		const promize = new Promise((resolve, reject) => {
			const searchPath = self.$getCurrentFilePath(req)
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
						/*Natural order suggestions sort*/
						result.suggestions = result.suggestions
						.sort((a, b) => (a.entry).localeCompare(b.entry));
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
