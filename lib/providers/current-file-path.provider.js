const path = require('path');
const fs = require('fs');
const logger = require('../util/logger');
const BasePathProvider = require('./base-path.provider');
const BaseFormatter = require('../formatters/base.formatter');
const SuggestionsDTO = require('../dto/suggestions.dto');

class CurrentFilePathProvider extends BasePathProvider {
	constructor(formatter) {
		super();
		this.id = 'CurrentFilePathProvider';
		this.priority = 9999;
		this.scopeSelector = '.source .string.quoted, .text.xml .string';
		this.formatter = formatter instanceof BaseFormatter
										? formatter : new DefaultFormatter();
    this._logger = logger.getLogger('CurrentFilePathProvider');
	}

	/**
	 * canResolve - Determines wether this provider can resolve suggestions
	 *
	 * @param  {object} req Request options
	 * @return {object}     {@code true} if this provider can resolve suggestions. {@code false} otherwise
	 */
	canResolve(req) {
		return this.$getCurrentLineUpCursor(req, true) ? true : false;
	}

	/**
	 * resolve - Resolve suggestions
	 *
	 * @param  {object} req Request options
	 * @return {object}     Autocomplete suggestions
	 */
	resolve(req) {
		const self = this;
		const promize = new Promise((resolve, reject) => {
			const searchPath = self.$getCurrentFilePath(req, true);
			const result = new SuggestionsDTO(this.$getPrefix(req));
			if (searchPath) {
				try {
					fs.readdir(searchPath,
						   (e, entries) => {
						if (e) { self._logger.warn(e); }
						result.suggestions.push({type: 'dir', entry: '..'});
						entries.forEach((entry) => {
							let entryStats = fs.statSync(path.resolve(searchPath, entry));
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
					self._logger.warn(err);
					reject(err);
				}
			} else {
				resolve(self.formatter.format(result));
			}
		});
		return promize;
  }

	/**
   * dispose - Provides a mechanism to release resources before disposing
   *
   * @return {void}
   */
  dispose() {
    this.formatter = null;
  }

	/**
	 * $getPrefix - Return replacement prefix
	 *
	 * @param  {object} req Request options
	 * @return {string}     Replacement prefix
	 */
	$getPrefix(req){
    const regex = /[^\"\'\/]+$/;
    const match = this.$getCurrentLineUpCursor(req, true).match(regex);
    return match ? match[0] : '';
  }
}
CurrentFilePathProvider.id = 'CurrentFilePathProvider';
module.exports = CurrentFilePathProvider;
