const settings = require('../config/settings');
const consts = require('../config/consts');
const logger = require('../util/logger');
const BasePathProvider = require('./base-path.provider');
const DefaultFormatter = require('../formatters/default.formatter');
const BaseFormatter = require('../formatters/base.formatter');

class CurrentFilePathProvider extends BasePathProvider {
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
     * canResolve - Determines wether this provider can resolve suggestions
     *
     * @param  {object} req Request options
     * @return {object}     {@code true} if this provider can resolve suggestions. {@code false} otherwise
     */
    canResolve(req) {
        // return this.$getCurrentLineUpCursor(req, true) ? true : false
        const match = this.$getCurrentLineUpCursor(req, true).match(
            this._singleFileDirRegex
        );
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
    $getPrefix(req) {
        const regex = /[^"'/]+$/;
        const match = this.$getCurrentLineUpCursor(req, true).match(regex);
        return match ? match[0] : '';
    }
}
CurrentFilePathProvider.id = 'CurrentFilePathProvider';
module.exports = CurrentFilePathProvider;
