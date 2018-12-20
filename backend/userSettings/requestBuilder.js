function getRequestBody(requestItems) {
	var nameOfSettingsList = [];
	if (requestItems && typeof requestItems == 'string'){
		nameOfSettingsList = requestItems.split(',');
	} else {
		nameOfSettingsList = requestItems || [];
	}

	var data = nameOfSettingsList.map(function (setting) {
		return '<string>' + setting + '</string>';
	});

	var payload = '<NameOfSettings>' + data.join('') + '</NameOfSettings>';

	return '<userProfileBySettingsRequest xmlns="http://www.reuters.com/ns/2007/11/30/aaa/cpap/roleandsetting/live">' +
		payload +
	'</userProfileBySettingsRequest>';
}

module.exports = function (requestSettings, uuid) {
	var body = getRequestBody(requestSettings);

	return '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
		'<soap:Header>' +
			'<userIdentity xmlns="http://schemas.reuters.com/ns/2005/08/infrastructure/tornado_soap">' +
				'<UUID xmlns="http://schemas.reuters.com/ns/2007/10/cp/user_identity">' + uuid + '</UUID>' +
			'</userIdentity>' +
		'</soap:Header>' +
		'<soap:Body>' +
			body +
		'</soap:Body>' +
	'</soap:Envelope>';
};
