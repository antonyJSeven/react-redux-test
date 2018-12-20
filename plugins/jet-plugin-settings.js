/**
 * @namespace
 */
JET.Settings = {};

JET.plugin(function() {

    function isObject(val) {
        return Object.prototype.toString.call(val) === '[object Object]';
    }

    function isString(val) {
        return (typeof val == 'string' || val instanceof String);
    }

    function isFunction(val) {
        return Object.prototype.toString.call(val) === '[object Function]';
    }

    var api = {};
    var baseSubID = ((new Date()).getTime() + "");
    var lastSubID = 0;
    var subscribers = {};
    var isSubscribed = false;
    
    // For the receiving channel name
    JET.onLoad(function() {
        if (JET.ContainerDescription && JET.ContainerDescription.GUID) {
            baseSubID = JET.ContainerDescription.GUID;
        }
    });

    function isValidSettingData(data) {
        return isObject(data) &&
               data.providerName && isString(data.providerName) &&
               data.settingName && isString(data.settingName);
    }
    
    /**
     * A callback function to be executed when setting value is ready
     * @callback JET.Settings~ReadingCallback
     * @param {string} value - Setting's value
     */

    /**
     * A callback function to be executed when setting value cannot be read
     * @callback JET.Settings~ReadingErrorCallback
     * @param {string} msg - Error message
     */

    /**
     * Setting's information
     * @typedef JET.Settings~ReadingSettingInfo
     * @property {string} providerName - For now, only "Configuration" provider is supported. "Segmentation" and "Theme" provider have not been supported yet
     * @property {string} settingName - e.g. "USERDETAILS.PREFERREDLANGUAGE"
     * @property {boolean} [expandValue] - Specifying whether you want to expand the value of setting when it refer to the other setting. The default value is true
     */

    /**
     * Setting's information
     * @typedef JET.Settings~WritingSettingInfo
     * @property {string} providerName - For now, only "Configuration" provider is supported. "Segmentation" and "Theme" provider have not been supported yet
     * @property {string} settingName - e.g. "USERDETAILS.PREFERREDLANGUAGE"
     * @property {string} settingValue - Setting's value
     */

    /**
     * Read value of a setting
     * @function read
     * @memberof JET.Settings
     * @param {JET.Settings~ReadingCallback} handler - A callback function to be executed when setting value is ready
     * @param {JET.Settings~ReadingSettingInfo} data - Setting's information
     * @param {JET.Settings~ReadingErrorCallback} [errorHandler] - A callback function to be executed when setting value cannot be read
     *
     * @example
     * JET.Settings.read(onValueReady, {
     *   providerName: "Configuration",
     *   settingName: "USERDETAILS.PREFERREDLANGUAGE"
     * });
     *
     * function onValueReady (value) {};
     */
    function read(handler, data, errorHandler)  {
        if (isFunction(handler) && isValidSettingData(data)) {
            // Creating channel name for receiving
            var channelID = baseSubID + (lastSubID++) + Date.now();
            var responseChannelName = "/eikon/settings_" + channelID;
            
            // Subscribe for receiving response from the container later later
            JET.subscribe(responseChannelName, function(resData) {
                var jsonResult = JSON.parse(resData);
                
                if(jsonResult) {
                    var errMsg = 'Invalid data type or error returned from container';

                    if (isString(jsonResult.responseChannel)) {
                        JET.unsubscribe(jsonResult.responseChannel);
                    } else {
                        JET.critical(errMsg);
                    }

                    // Actually, jsonResult.settingName is a value of setting not a name of setting.
                    var settingValue = jsonResult.settingName;

                    // setting value can be empty string
                    if (isString(settingValue) && jsonResult.result === true) {
                        handler.call(window, jsonResult.settingName);
                    } else {
                        if (isFunction(errorHandler)) {
                            errorHandler.call(window, errMsg);
                        } else {
                            JET.critical(errMsg);
                        }
                    }
                }
            });

            // Publishing the request. This is an asynchronous request. When the response is received, the handler passed will be called.
            data.responseChannel = responseChannelName;
            data.requestType = "r";
            JET.publish("/eikon/settings", JSON.stringify(data));
        } else {
            JET.critical("Invalid data type passed. First parameter must be a handler and the second one must be an object with providerName and settingName as string. expandValue as bool is optional in the object");
        }
    }

    /**
     * Write value of a setting
     * @function write
     * @memberof JET.Settings
     * @param {JET.Settings~WritingSettingInfo} data - Setting's information
     *
     * @example
     * JET.Settings.write({
     *   providerName: "Configuration",
     *   settingName: "KOBRA.OBJECTS.METASTOCK.CHARTPREFERENCES.DEFAULTANALYSISONEINSTRUMENT"
     *   settingValue: "Line"
     * })
     */
    function write(data) {
        // data.settingValue can be empty string.
        if (isValidSettingData(data) && isString(data.settingValue)) {
            // Publish the write setting request. Asynchronous. The container should write it.
            data.requestType = "w";
            JET.publish("/eikon/settings", JSON.stringify(data));
        }
        else {
            JET.critical("Invalid data type passed. The parameter must be an object with providerName, settingName and settingValue as string attributes.");
        }
    }

    /**
     * Setting's change information
     * @typedef JET.Settings~ChangeSettingInfo
     * @property {string} providerName - For now, only "Configuration" provider is supported. "Segmentation" and "Theme" provider have not been supported yet
     * @property {string} settingName - e.g. "USERDETAILS.PREFERREDLANGUAGE"
     * @property {string} oldValue - String value of the setting before changing
     * @property {string} newValue - String value of the setting after changing
     */

    /**
     * A callback function to be executed when setting value is changed
     * @callback JET.Settings~onChangeCallback
     * @param {JET.Settings~ChangeSettingInfo} value - Setting's value
     */

    /**
     * Notify when setting changed
     * @function onChange
     * @memberof JET.Settings
     * @param {JET.Settings~onChangeCallback} handler - A callback function to be executed when setting value has been changed
     * @param {JET.Settings~ReadingSettingInfo} data - Information of the watched setting
     *
     * @example
     * JET.Settings.onChange(onSettingChanged, {
     *   providerName: "Configuration",
     *   settingName: "KOBRA.OBJECTS.METASTOCK.CHARTPREFERENCES.DEFAULTANALYSISONEINSTRUMENT"
     * })
     *
     * function onSettingChanged (value) {};
     */
    function onChange(handler, data) {
        if (isFunction(handler) && isValidSettingData(data)) {
            if (!isSubscribed) {
                isSubscribed = true;
                JET.subscribe('/eikon/settings/change', onSettingChanged);
            }
            if (!subscribers[data.providerName]) {
                subscribers[data.providerName] = {}
            }

            if (!subscribers[data.providerName][data.settingName]) {
                subscribers[data.providerName][data.settingName] = [];
            }

            subscribers[data.providerName][data.settingName].push(handler);

            JET.publish("/eikon/settings/subscribe_change", JSON.stringify(data));
        }
        else {
            JET.critical("Invalid data type passed. First parameter must be a handler and the second one must be an object with providerName and settingName as string attributes");
        }
    }

    function onSettingChanged(data) {
        if (isString(data)) {
            data = JSON.parse(data);
        }

        if (isValidSettingData(data) && isString(data.newValue)) {
            var pn = data.providerName;
            var sn = data.settingName;

            if (subscribers[pn] && subscribers[pn][sn]) {
                var handlers = subscribers[pn] && subscribers[pn][sn];
                for (var i = 0; i < handlers.length; i++) {
                    handlers[i](data);
                }
            }
        }
    }
    
    return {
        name: 'Settings',
        api: {
            'Settings': {
                read: read,
                write: write,
                onChange: onChange
            }
        }
    };
});
