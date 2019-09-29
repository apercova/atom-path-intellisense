'use babel'

import path from 'path';
import fs from 'fs';
import BasePathProvider from './base-path.provider';
import SuggestionsDTO from '../../dto/suggestions.dto.js';

export default class CurrentFilePathProvider extends BasePathProvider {
	constructor() {
		super();
		this.id = 'CurrentFilePathProvider';
		this.priority = 9999;
	}
	canResolve(req) {
		return this.$getCurrentLine(req) ? true : false;
	}
	resolve(req) {
		const promize = new Promise((resolve, reject) => {
			const searchPath = this.$getCurrentFilePath(req)
			const result = new SuggestionsDTO(
				this.$getPrefix(req),
				[]
			);

			if (searchPath) {
				try {
					fs.readdir(searchPath, function(e, entries){
						result.suggestions.push({type: 'dir', entry: '..'});
						entries.forEach(function (entry) {
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
						resolve(result);
					});
				} catch (err) {
					reject(err);
				}
			} else {
				resolve(result);
			}
		});
		return promize;
  }
}
