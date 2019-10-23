'use strict';
const settings = require('../config/settings');
const consts = require('../config/consts');
const logger = require('../util/logger');
const BasePathProvider = require('./base-path.provider');
const DefaultFormatter = require('../formatters/default.formatter');
const BaseFormatter = require('../formatters/base.formatter');

/**
 *
 * @class
 * @Classdesc Path provider for current file path.
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
class CurrentFilePathProvider extends BasePathProvider {
    /**
     * @param  {BaseFormatter} formatter Formatter instance.
     * @return {CurrentFilePathProvider} CurrentFilePathProvider instance.
     */
    constructor(formatter) {
        super();
        this.id = 'CurrentFilePathProvider';
        this.priority = 9999;
        this.scopeSelector = settings[`${consts.CF_ALLOWED_SCOPES}`].default;
        this.formatter =
            formatter instanceof BaseFormatter
                ? formatter
                : new DefaultFormatter();
        this._logger = logger.getLogger(this.id);
        this._singleFileDirRegex = /^[^./].*$/;
    }

    /**
     * canResolve - Determines whether this provider can resolve suggestions based on context.
     *
     * @param  {object} req Request oprions.
     * @return {boolean}    true if this provider can resolve suggestions. false otherwise.
     */
    canResolve(req) {
        const match = this.$getCurrentLineUpCursor(req, true).match(
            this._singleFileDirRegex
        );
        return match ? true : false;
    }

    /**
     * resolve - Resolve suggestions.
     *
     * @param  {object} req Request options.
     * @return {Promise}    Promise for resolving path suggestions.
     */
    resolve(req) {
        return this.$resolveSuggestions(req, this.$resolveSearchPathSync(req));
    }

    /**
     * $getPrefix - Return replacement prefix for suggestions.
     *
     * @param  {object} req Request options.
     * @return {string}     Replacement prefix.
     */
    $getPrefix(req) {
        const regex = /[^"'/]+$/;
        const match = this.$getCurrentLineUpCursor(req, true).match(regex);
        return match ? match[0] : '';
    }
}
CurrentFilePathProvider.id = 'CurrentFilePathProvider';
module.exports = CurrentFilePathProvider;
