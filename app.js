'use strict';

var userSettings = require('./backend/userSettings/index.js');
var logger = require('./backend/logger.js');
var appHits = require('./backend/appHits.js');

function configure(app) {
	userSettings(app);
	logger(app);
	appHits(app);
}
exports.configure = configure;
