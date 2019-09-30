'use babel'

import path from 'path';
import fs from 'fs';
import BasePathProvider from '../base-path.provider.js';
import BaseFormatter from '../../formatters/base.formatter.js';
import SuggestionsDTO from '../../dto/suggestions.dto.js';

export default class PatternBasedPathProvider extends BasePathProvider {
	constructor(formatter) {
		super();
		this.id = 'PatternBasedPathProvider';
		this.priority = 9999;
		this.scopeSelector = '.source .string.quoted, .text.xml .string';
		this.formatter = formatter instanceof BaseFormatter
										? formatter : new DefaultFormatter();
	}

	canResolve(req) {
		return this.$getCurrentLine(req) ? true : false;
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
