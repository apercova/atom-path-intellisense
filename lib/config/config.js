const consts = require('./consts');
const settings = require('./settings');

function isManualModeOn() {
    return (
        atom.config.get(
            `${consts.PACKAGE_NAME}.${consts.CF_MANUAL_SUGGEST}`
        ) === true
    );
}
function getAllowedScopes() {
    return atom.config.get(
        `${consts.PACKAGE_NAME}.${consts.CF_ALLOWED_SCOPES}`
    );
}
function AllProvidersStrategyOn() {
    return (
        atom.config.get(
            `${consts.PACKAGE_NAME}.${consts.CF_PROVIDER_STRATEGY_ALL}`
        ) === true
    );
}
function isDebugEnabled() {
    return atom.inDevMode()
        ? true
        : atom.config.get(
            `${consts.PACKAGE_NAME}.${consts.CF_ENABLE_DEBUG}`
        ) === true;
}
function addObserver(conf, fn) {
    if (conf && typeof fn === 'function') {
        atom.config.observe(`${consts.PACKAGE_NAME}.${conf}`, fn);
    }
}

module.exports = {
    settings,
    isManualModeOn,
    getAllowedScopes,
    AllProvidersStrategyOn,
    isDebugEnabled,
    addObserver
};
