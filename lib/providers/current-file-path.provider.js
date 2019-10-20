const path = require('path');
const fs = require('fs');
const logger = require('../util/logger');
const winston = require('winston');
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
		this.singleFileDirRegex = /^[^\.\/].*$/;
    this._logger = logger.getLogger(this.id);
	}

	/**
	 * canResolve - Determines wether this provider can resolve suggestions
	 *
	 * @param  {object} req Request options
	 * @return {object}     {@code true} if this provider can resolve suggestions. {@code false} otherwise
	 */
	canResolve(req) {
		// return this.$getCurrentLineUpCursor(req, true) ? true : false
		const match = this.$getCurrentLineUpCursor(req, true).match(this.singleFileDirRegex);
		return match ? true : false;
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

	/**
	 * $getPrefix - Return replacement prefix
	 *
	 * @param  {object}        req    Request options
   * @param  {SearchPathDTO} search Search options
	 * @return {string}               Replacement prefix
	 */
	$getPrefix(req, search){
    const regex = /[^\"\'\/]+$/;
    const match = this.$getCurrentLineUpCursor(req, true).match(regex);
    return match ? match[0] : '';
  }
}
CurrentFilePathProvider.id = 'CurrentFilePathProvider';
module.exports = CurrentFilePathProvider;
