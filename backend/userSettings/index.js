var ws = require('ws.js');
var xml2js = require('xml2js').parseString;

var colorSchemeMap = require('./colorSchemeMap.js');
var requestBuilder = require('./requestBuilder.js');

var REQUEST_SETTINGS = [
	'COMMON.REGIONAL_SETTINGS.UI_LANGUAGE',
	'COMMON.REGIONAL_SETTINGS.NUMBERFORMAT_GROUPSEPARATOR',
	'COMMON.REGIONAL_SETTINGS.NUMBERFORMAT_DECIMALSEPARATOR',
	'COMMON.REGIONAL_SETTINGS.DATEFORMAT_DATEPATTERN',
	'COMMON.REGIONAL_SETTINGS.DATEFORMAT_SHORTDATEPATTERN',
	'COMMON.REGIONAL_SETTINGS.DATEFORMAT_TIMEZONE',
	'COMMON.REGIONAL_SETTINGS.DATEFORMAT_TIMEPATTERN',
	'COMMON.REGIONAL_SETTINGS.DATEFORMAT_SEPARATOR',
	'COMMON.REGIONAL_SETTINGS.LISTFORMAT_SEPARATOR',
	'DACT_LANGUAGES_READ_BY_USER',
	'RDE_USER_CURRENT_TICK_COLOR',
	'RDE_USER_CURRENT_THEME'
];
var DEFAULT_END_POINT = 'http://amers1.adminws.cp.icp2.mpp.ime.reuters.com/RoleAndSettingLive/RoleAndSettingLiveServices_1.asmx';
var SOAP_ACTION = 'http://www.reuters.com/ns/2007/11/30/aaa/cpac/roleandsetting/live/GetUserProfileBySettings_1';

function configure(app) {
	app.get('/GetUserSettings', function (context, payload, req, res) {
		var uuid = context.getUUID();
		var request = requestBuilder(REQUEST_SETTINGS, uuid);
		var endPoint = (context.getConfiguration('serviceEndpoint') && context.getConfiguration('serviceEndpoint')['RoleAndSettingLive']) || DEFAULT_END_POINT;

		var requestContext = {
			request: request,
			url: endPoint,
			action: SOAP_ACTION,
			contentType: 'text/xml; charset=utf-8'
		};

		var handlers = [new ws.Http()];

		ws.send(handlers, requestContext, function (ctx) {
			xml2js(ctx.response, function (err, result) {
				if (err) {
					res.send(500, err);
				} else {
					var responseBody = result['soap:Envelope']['soap:Body'][0];
					if (!result['soap:Fault'] && !responseBody['soap:Fault']) {
						var parsedResponseBody = parseResponseBody(responseBody);

						var response = decorateResponse(parsedResponseBody, payload, uuid);

						res.send(200, response);
					} else {
						res.send(200, { result: resultBody['soap:Fault'][0]['faultstring'] });
					}
				}
			});
		});

	});
}

function parseResponseBody(responseBody) {
	var _result = responseBody['GetUserProfileBySettings_1Result'][0]['UserProfile'][0]['Settings'][0]['SettingInfo'];
	if (Object.prototype.toString.call(_result) !== '[object Array]') {
		_result = [_result];
	}
	if (typeof _result === 'string'){
		_result = [];
	}
	var resultObject = {};
	var resultCount = _result.length;
	for (var i = 0; i < resultCount; i++) {
		resultObject[_result[i].TechnicalName[0]] = _result[i].Value[0];
	}
	return resultObject;
}

function decorateResponse(resultObject, payload, uuid) {
	var varName = payload.Varname || 'window.UserSettings';

	if (!resultObject['COMMON.REGIONAL_SETTINGS.UI_LANGUAGE'] || resultObject['COMMON.REGIONAL_SETTINGS.UI_LANGUAGE'] === 'en') {
		resultObject['COMMON.REGIONAL_SETTINGS.UI_LANGUAGE'] = 'en-US';
	}

	resultObject.UUID = uuid;

	resultObject['RDE_USER_CURRENT_TICK_COLOR'] = colorSchemeMap[resultObject['RDE_USER_CURRENT_TICK_COLOR']] || colorSchemeMap['American'];

	var resultScript = varName + ' = ' + JSON.stringify(resultObject) + ';';

	return resultScript + 'window["EikonLocale"] = "' + resultObject['COMMON.REGIONAL_SETTINGS.UI_LANGUAGE'].substr(0, 2) + '";';
}

module.exports = configure;
