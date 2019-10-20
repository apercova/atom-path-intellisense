const settings = require('./config/settings');
const provider = require('./path-provider');

module.exports = {
    config: settings,
    provide: function() {
        return provider;
    }
};
