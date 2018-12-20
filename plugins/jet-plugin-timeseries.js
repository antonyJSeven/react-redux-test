JET.plugin(function () {
    var tsReq = 0;

    // Create JET.Data namespace if it doesn't exist
    if (JET.Data === undefined) {
        JET.Data = {};
    }

    function formatTSData(d) {
        var temp = d.timeSeriesData && d.timeSeriesData.records ? d.timeSeriesData.records : [],
            types = [
                ["doubleFields", "doubleValues"],
                ["integerFields", "integerValues"],
                ["stringFields", "stringValues"],
                ["timeFields", "timeValues"]
            ];

        function record(r) {
            var rec = {};
            types.forEach(function (t) {
                var fs = r[t[0]] ? r[t[0]] : [],
                    vs = r[t[1]] ? r[t[1]] : [];
                fs.forEach(function (f, i) {
                    rec[f] = vs[i];
                });
            });
            return rec;
        }

        return temp.map(function (tr) {
            return record(tr);
        });
    }

    // get matched currency meta data
    function getCurrencyMetaData(tsReq, currency) {
        var request = { "type": "Currency", "feed": "IDN" };
        var isfound = false;
        return new Promise(function (resolve, reject) {
            var subId,
                req = { "requestType": "AssetListRequest" },
                cb = function (d) {
                    var data = JSON.parse(d);
                    if (data.timeSeriesAssetCurrency) {
                        switch (data.timeSeriesAssetCurrency.dataReceptionType) {
                            case "Load":
                                if (data.timeSeriesAssetCurrency.record.shortName === currency) {
                                    isfound = true;
                                    resolve(data.timeSeriesAssetCurrency.record);
                                }
                                JET.debug("JET.Data currency response for subid: " + subId, data);
                                break;
                            case "LoadLastChunk":
                                if (!isfound) {
                                    resolve(null);
                                    JET.debug("Currency " + currency + " doesn't exist.");
                                }
                                if (subId) {
                                    JET.debug("Last chunk for currency received, subId " + subId);
                                }
                                break;
                            default:
                                JET.debug("Unknown response type for currency", data);
                        }
                    }
                    else {
                        reject("Unknown response for currency");
                    }

                },
            subId = window.top.EikonData.TimeSeries.subscribe(cb);
            req.data = request;
            window.top.EikonData.TimeSeries.request(JSON.stringify(req), tsReq, subId);
        });
    }

    // get unit meta data table
    function getUnitMetaData(tsReq) {
        var request = { "type": "Unit", "feed": "IDN" };
        return new Promise(function (resolve, reject) {
            var unitMetaData = {};
            var subId,
                req = { "requestType": "AssetListRequest" },
                cb = function (d) {
                    var data = JSON.parse(d);
                    if (data.timeSeriesAssetUnit) {
                        switch (data.timeSeriesAssetUnit.dataReceptionType) {
                            case "Load":
                                var record = data.timeSeriesAssetUnit.record;
                                if (record.baseType !== 0) {
                                    unitMetaData[record.unitType] = data.timeSeriesAssetUnit.record;
                                }
                                JET.debug("JET.Data unit response for subid: " + subId, data);
                                break;
                            case "LoadLastChunk":
                                resolve(unitMetaData);
                                if (subId) {
                                    JET.debug("Last chunk for unit received, subId " + subId);
                                }
                                break;
                            default:
                                JET.debug("Unknown response type for unit", data);
                        }
                    }
                    else {
                        reject("Unknown response for currency");
                    }

                },
            subId = window.top.EikonData.TimeSeries.subscribe(cb);
            req.data = request;
            window.top.EikonData.TimeSeries.request(JSON.stringify(req), tsReq, subId);
        });
    }

    function getTargetUnit(unitMetaData, targetUnitName) {
        var targetUnit = null;
        for (var key in unitMetaData) {
            var unitData = unitMetaData[key];
            if (unitData.shortName === targetUnitName) {
                targetUnit = unitData
                break;
            }
        }

        if (!targetUnit) JET.debug("Target unit " + targetUnitName + " doesn't exist.");
        return targetUnit;
    }

    // get time zone meta data
    function getTimeZoneMetaData(tsReq, timeZone) {
        var request = { "type": "TimeZone", "feed": "IDN" };
        return new Promise(function (resolve, reject) {
            var subId,
                req = { "requestType": "AssetListRequest" },
                cb = function (d) {
                    var data = JSON.parse(d);
                    if (data.timeSeriesAssetTimezone) {
                        switch (data.timeSeriesAssetTimezone.dataReceptionType) {
                            case "Load":
                                if (data.timeSeriesAssetTimezone.record.shortName === timeZone) {
                                    resolve(data.timeSeriesAssetTimezone.record);
                                }
                                JET.debug("JET.Data time zone metadata response for subid: " + subId, data);
                                break;
                            case "LoadLastChunk":
                                if (subId) {
                                    JET.debug("Last chunk for time zone metadata received, subId " + subId);
                                }
                                break;
                            default:
                                JET.debug("Unknown response type for time zone metadata", data);
                        }
                    }
                    else {
                        reject("Unknown response for time zone metadata");
                    }

                },
            subId = window.top.EikonData.TimeSeries.subscribe(cb);
            req.data = request;
            window.top.EikonData.TimeSeries.request(JSON.stringify(req), tsReq, subId);
        });
    }

    // get asset information for an instrument
    function getAssetInfo(tsReq, ric) {
        var request = { "ric": ric, "feed": "IDN", "types": 2 };
        return new Promise(function (resolve, reject) {
            var subId,
                req = { "requestType": "AssetRequest" },
                cb = function (d) {
                    var data = JSON.parse(d);
                    if (data.timeSeriesError) {
                        JET.debug("JET.Data asset error: " + data.timeSeriesError);
                        reject(data.timeSeriesError);
                    }
                    else {
                        if (data.timeSeriesAssetData) {
                            switch (data.timeSeriesAssetData.dataReceptionType) {
                                case "LoadLastChunk":
                                    resolve(data.timeSeriesAssetData.record);
                                    JET.debug("JET.Data asset response for subid: " + subId, data);
                                    break;
                                default:
                                    JET.debug("Unknown response type for instrument asset", data);
                            }
                        }
                        else {
                            reject("Unknown response for instrument asset");
                        }
                    }
                },
            subId = window.top.EikonData.TimeSeries.subscribe(cb);
            req.data = request;
            window.top.EikonData.TimeSeries.request(JSON.stringify(req), tsReq, subId);
        });
    }

    // get asset conversion information for an instrument
    function getAssetConversionInfo(tsReq, ric) {
        var request = { "ric": ric, "feed": "IDN", "types": 32 };
        return new Promise(function (resolve, reject) {
            var subId,
                req = { "requestType": "AssetRequest" },
                cb = function (d) {
                    var data = JSON.parse(d);
                    if (data.timeSeriesAssetConversion) {
                        switch (data.timeSeriesAssetConversion.dataReceptionType) {
                            case "Load":
                            case "LoadLastChunk":
                                resolve(data.timeSeriesAssetConversion);
                                JET.debug("JET.Data asset conversion response for subid: " + subId, data);
                                break;
                            default:
                                JET.debug("Unknown response type for instrument asset conversion", data);
                        }
                    }
                    else {
                        reject("Unknown response for instrument asset conversion");
                    }

                },
            subId = window.top.EikonData.TimeSeries.subscribe(cb);
            req.data = request;
            window.top.EikonData.TimeSeries.request(JSON.stringify(req), tsReq, subId);
        });
    }

    // binary search and return most closest index less than search value if it's not found
    function binaryIndexOf(datestr, dataArray) {
        var minIndex = 0;
        var maxIndex = dataArray.length - 1;
        var currentIndex;
        var currentDate;
        var searchDate = new Date(datestr).getTime();
        if (maxIndex === 0) return maxIndex;

        var storeIndex = 0;
        while (minIndex < maxIndex) {
            currentIndex = (minIndex + maxIndex) / 2 | 0;
            currentDate = new Date(dataArray[currentIndex].TIMESTAMP).getTime();

            if (currentDate <= searchDate) {
                minIndex = currentIndex + 1;
                storeIndex = currentIndex;
            }
            else {
                maxIndex = currentIndex;
            }
        }

        var storeDate = new Date(dataArray[storeIndex].TIMESTAMP).getTime();
        if (storeDate === searchDate) {
            return storeIndex;
        }
        else {
            if (dataArray[storeIndex + 1] && new Date(dataArray[storeIndex + 1].TIMESTAMP).getTime() < searchDate) {
                return (storeIndex + 1);
            }
            else {
                return storeIndex;
            }
        }
    }

    // currency conversion
    function convertDataToNewCurrency(currencyInfo, ricData, currencyData) {
        var currencyPoint, rateIndex;
        if (currencyInfo.isQuoted) {
            ricData.forEach(function (item, index) {
                rateIndex = binaryIndexOf(item.TIMESTAMP, currencyData);
                // use currency close value for all
                currencyPoint = currencyData[rateIndex];
                if (item.OPEN) {
                    item.OPEN *= currencyPoint.CLOSE;
                }
                if (item.HIGH) {
                    item.HIGH *= currencyPoint.CLOSE;
                }
                if (item.LOW) {
                    item.LOW *= currencyPoint.CLOSE;
                }
                if (item.CLOSE) {
                    item.CLOSE *= currencyPoint.CLOSE;
                }
                if (item.VALUE) {
                    item.VALUE *= currencyPoint.VALUE;
                }
            });
        }
        else {
            var baseRefactor = currencyInfo.baseRelationFraction === 0 ? 1 : currencyInfo.baseRelationFraction;
            ricData.forEach(function (item, index) {
                rateIndex = binaryIndexOf(item.TIMESTAMP, currencyData);
                currencyPoint = currencyData[rateIndex];
                if (item.OPEN) {
                    item.OPEN = item.OPEN / currencyPoint.CLOSE * baseRefactor;
                }
                if (item.HIGH) {
                    item.HIGH = item.HIGH / currencyPoint.CLOSE * baseRefactor;
                }
                if (item.LOW) {
                    item.LOW = item.LOW / currencyPoint.CLOSE * baseRefactor;
                }
                if (item.CLOSE) {
                    item.CLOSE = item.CLOSE / currencyPoint.CLOSE * baseRefactor;
                }
                if (item.VALUE) {
                    item.VALUE = item.VALUE / currencyPoint.VALUE * baseRefactor;
                }
            });
        }
        return ricData;
    }

    function createCurrencyRequest(request, ric) {
        var factor = 1;
        var interval = request.intervalType;
        if (interval === "Daily") factor = 1.5;
        else if (interval === "Minute") {
            factor = 6;
        }
        else if (interval === "Tick") {
            factor = 7;
        }

        var numOfPoints = request.numberOfPoints && request.numberOfPoints > 0 ? request.numberOfPoints * factor : undefined;

        var currencyRequest = {
            "ric": ric,
            "numberOfPoints": numOfPoints,
            "feed": request.feed,
            "view": request.view,
            "timeZone": request.timeZone,
            "intervalType": request.intervalType,
            "intervalLength": request.intervalLength,
            "from": request.from,
            "to": request.to
        };
        return currencyRequest;
    }

    function getTimeOffset(timeZoneObj) {
        var date = new Date().getTime();
        var summerStart = timeZoneObj.summerStart ? new Date(timeZoneObj.summerStart).getTime() : null;
        var summerEnd = timeZoneObj.summerEnd ? new Date(timeZoneObj.summerEnd).getTime() : null;
        if (summerStart !== null && summerEnd !== null && date >= summerStart && date < summerEnd) {
            return timeZoneObj.summerOffset * 60 * 1000;
        }
        else {
            return timeZoneObj.gmtOffset * 60 * 1000;
        }
    }

    function convertToLocalTimeStamp(data, timeZone) {
        if (timeZone) {
            data.forEach(function (r) {
                var date = new Date(r.TIMESTAMP);
                var offset = getTimeOffset(timeZone);
                date = new Date(date.getTime() + offset);
                r.TIMESTAMP = date.toISOString();
                r.TIMESTAMP = r.TIMESTAMP.substring(0, r.TIMESTAMP.length - 1); // remove "Z" at the end
            });
        }
        return data;
    }

    // Do unit conversion. Examples: CLc1, XAU=, Cc1, BRT-, LCOc1, SBc1, KCc1, Wc1, LWBc1, REF-RU-TPUT(meta stock chart unit conversion is wrong)
    function convertToTargetUnit(data, allowedConversions, unitMetaData, sourceUnitType, targetUnitName) {
        // find converted factor
        var factor = 1;
        var sourceUnitData = unitMetaData[sourceUnitType];
        var targetUnitdata = getTargetUnit(unitMetaData, targetUnitName);

        if (!sourceUnitData || !targetUnitdata) return data;

        var factor = getConversionFactor(sourceUnitData, targetUnitdata, unitMetaData, allowedConversions);
        if (factor !== 1) {
            data.forEach(function (item) {
                if (item.OPEN) {
                    item.OPEN = item.OPEN * factor;
                }
                if (item.HIGH) {
                    item.HIGH = item.HIGH * factor;
                }
                if (item.LOW) {
                    item.LOW = item.LOW * factor;
                }
                if (item.CLOSE) {
                    item.CLOSE = item.CLOSE * factor;
                }
                if (item.VALUE) {
                    item.VALUE = item.VALUE * factor;
                }
            });
        }
        return data;
    }

    // get unit conversion factor
    function getConversionFactor(fromUnit, toUnit, unitMetaData, unitCrossFactors) {
        var factor = 1;

        if (!fromUnit || !toUnit) return factor;

        // check if source and destination have same category
        if (fromUnit.category === toUnit.category) {
            if (toUnit.baseType === fromUnit.unitType) {
                factor = 1 / toUnit.conversion;
            }
            else if (fromUnit.baseType === toUnit.unitType) {
                factor = fromUnit.conversion;
            }
            else { // both are not base unit of the other, but both have same base type
                factor = fromUnit.conversion;
                factor = factor / toUnit.conversion;
            }
        }
        else {
            if (!unitCrossFactors || unitCrossFactors.length === 0) {
                return factor;
            }
            // cross category conversion
            for (var ii = 0; ii < unitCrossFactors.length; ++ii) {
                if (unitCrossFactors[ii].sourceType === fromUnit.unitType && unitCrossFactors[ii].destinationType === toUnit.baseType) {
                    // convert source type/from unit type to dest type
                    factor = unitCrossFactors[ii].factor;
                    // convert from dest type to target unit type
                    factor *= getConversionFactor(unitMetaData[toUnit.baseType], toUnit, unitMetaData, unitCrossFactors);
                    break;
                }
                else if (unitCrossFactors[ii].destinationType === fromUnit.unitType) {
                    // convert dest type/from unit type to source type                    
                    factor = 1 / unitCrossFactors[ii].factor;
                    var crossUnit = unitMetaData[unitCrossFactors[ii].sourceType];
                    if (crossUnit.category === toUnit.category) {
                        // convert source type to target unit type
                        factor *= getConversionFactor(crossUnit, toUnit, unitMetaData, unitCrossFactors);
                    }
                    else { // example: ric s "Wc1", unit is "BTU"
                        factor = 1; // no conversion for this case
                    }
                    break;
                }
                else if (unitCrossFactors[ii].sourceType === fromUnit.baseType && unitCrossFactors[ii].destinationType === toUnit.baseType) {
                    // convert from unit type to source type
                    factor = getConversionFactor(fromUnit, unitMetaData[unitCrossFactors[ii].sourceType], unitMetaData, unitCrossFactors);
                    // convert source type to dest type
                    factor *= unitCrossFactors[ii].factor;
                    // convert dest type to target unit type
                    factor *= getConversionFactor(unitMetaData[toUnit.baseType], toUnit, unitMetaData, unitCrossFactors);
                    break;
                }
                else if (unitCrossFactors[ii].sourceType === toUnit.baseType && unitCrossFactors[ii].destinationType === fromUnit.baseType) {
                    // convert from unit type to dest type
                    factor = getConversionFactor(fromUnit, unitMetaData[unitCrossFactors[ii].destinationType], unitMetaData, unitCrossFactors);
                    // convert dest type to source type
                    factor *= 1 / unitCrossFactors[ii].factor;
                    // convert source type to target unit type
                    factor *= getConversionFactor(unitMetaData[unitCrossFactors[ii].sourceType], toUnit, unitMetaData, unitCrossFactors);
                }
            }
        }
        return factor;
    }

    /**
    * @namespace
    */
    JET.Data.TimeSeries = {
        /**
        * Request data from the JET Container
        * @function request
        * @memberof JET.Data.TimeSeries
        * @param {Object} request
        * @return {Promise}  Promise object accepting resolve and reject callbacks
        * @example 
        var tsPromise = JET.Data.TimeSeries.request({"ric" : "IBM.N","view" : "ASK","numberOfPoints": 500,"timeZone" : "Instrument","intervalType" : "Tick","intervalLength" : 1, "currency": "GBP", "unit":""});
        symbPromise.then(resolve, reject); 
        */
        _assetInfo: null,
        _currencyInfo: null,
        _unitMetaData: null,
        _timeZoneInfo: null,
        _lastRicData: null,
        _allowedConversionObj: null,

        request: function (request) {
            var actualReqs = [request];
            var currency = request.currency || "";
            var isIntraday = request.intervalType && (request.intervalType === "Minute" || (request.intervalType === "Tick")) ? true : false;
            var isGmt = !request.timeZone || request.timeZone === "Gmt" ? true : false;
            if (currency !== "" && isIntraday) request.timeZone = "Gmt"; // for currency conversion
            var unit = request.unit || "";
            var ric = request.ric;

            function getData(request, tsReq) {
                return new Promise(function (resolve, reject) {
                    var formatedData = [];
                    var subId,
                    //wrap request obj
                    req = { "requestType": "DataRequest" },
                    cb = function (d) {
                        var data = JSON.parse(d);
                        if (data.timeSeriesError) {
                            JET.debug(data.timeSeriesError);
                            reject(data.timeSeriesError);
                        }
                        else {
                            if (data.timeSeriesData) {
                                switch (data.timeSeriesData.dataReceptionType) {
                                    case "Load":
                                        if (formatedData.length === 0) {
                                            formatedData = formatTSData(data);
                                        }
                                        else {
                                            formatedData = formatedData.concat(formatTSData(data));
                                        }
                                        JET.debug("JET.Data.timeseries response for subid: " + subId, data);
                                        break;
                                    case "LoadLastChunk":
                                        resolve(formatedData);
                                        if (subId) {
                                            //EikonData.TimeSeries.unsubscribe(subId);
                                            JET.debug("Last chunk received, subId " + subId, data);
                                        }
                                        break;
                                    default:
                                        JET.debug("Unknown response type", data);
                                }
                            } else if (data.timeSeriesStatusChanged) {
                                //to do, handle status changes
                            }
                            else {
                                reject("Unknown response");
                            }
                        }
                    },
                    subId = window.top.EikonData.TimeSeries.subscribe(cb);
                    req.data = request;
                    window.top.EikonData.TimeSeries.request(JSON.stringify(req), tsReq, subId);
                });
            };

            if (currency !== "" || unit !== "") {
                return new Promise(function (resolve, reject) {
                    getAssetInfo(++tsReq, request.ric).then(function (assetInfo) {
                        this._assetInfo = assetInfo;

                        // reset unit
                        unit = this._assetInfo.unit !== 0 ? unit : "";
                        var promises = [];
                        if (currency !== "") {
                            promises.push(getCurrencyMetaData(++tsReq, currency));
                        }
                        if (unit !== "") {
                            promises.push(getUnitMetaData(++tsReq));
                            // cross category conversion request
                            promises.push(getAssetConversionInfo(++tsReq, ric));
                        }
                        if (promises.length > 0) {
                            Promise.all(promises).then(function (dataArr) {
                                this._currencyInfo = currency !== "" ? dataArr[0] : null;
                                if (unit !== "") {
                                    if (dataArr.length === 2) {
                                        this._unitMetaData = dataArr[0];
                                    }
                                    else {
                                        this._unitMetaData = dataArr[1];
                                    }
                                }
                                // allowed cross category conversion object, it's the last object in the data array
                                this._allowedConversionObj = dataArr[dataArr.length - 1];

                                var timeZone = assetInfo.timeZone;
                                var sourceUnitType = assetInfo.unit;

                                var newPromises = [];

                                // reset ric data request timeZone if currency doesn't exist
                                if (!isGmt && !this._currencyInfo) {
                                    request.timeZone = "Instrument";
                                }
                                newPromises.push(getData(actualReqs[0], ++tsReq));
                                if (currency !== "" && this._currencyInfo) {
                                    // add currency request
                                    var currencyRic = this._currencyInfo.ric === "" ? (this._currencyInfo.baseCurrency + "=") : this._currencyInfo.ric;
                                    newPromises.push(getData(createCurrencyRequest(request, currencyRic), ++tsReq));

                                    // add time zone related request
                                    if (isIntraday) {
                                        newPromises.push(getTimeZoneMetaData(++tsReq, timeZone));
                                    }
                                }

                                Promise.all(newPromises).then(function (newDataArr) {
                                    var data = newDataArr[0]; // ric time series data

                                    if (currency !== "" && this._currencyInfo) {// currency conversion
                                        data = convertDataToNewCurrency(this._currencyInfo, newDataArr[0], newDataArr[1]);
                                        if (isIntraday && !isGmt) {
                                            data = convertToLocalTimeStamp(data, newDataArr[2]);
                                        }
                                    }

                                    // unit conversion
                                    if (unit !== "") {
                                        data = convertToTargetUnit(!data ? newDataArr[0] : data, this._allowedConversionObj.records, this._unitMetaData, sourceUnitType, unit);
                                    }
                                    resolve(data);
                                }, reject);

                            }, reject);
                        }
                        else {
                            getData(actualReqs[0], ++tsReq).then(function (data) {
                                resolve(data);
                            });
                        }
                    }, reject);
                });
            }
            else { // no currency conversion
                return getData(actualReqs[0], ++tsReq);
            }
        },

        /**
        * Request data from the JET Container
        * @function subscribe
        * @memberof JET.Data.TimeSeries
        * @param {Object} request
        * @return {Object}  Subscription object which is used to handle updates, errors, and to cancel the subscription
        * @example 
        var sub = JET.Data.TimeSeries.subscribe({"ric" : "IBM.N","view" : "ASK","numberOfPoints" : 500,"timeZone" : "Instrument","intervalType" : "Tick","intervalLength" : 1, "currency": "GBP", "unit":""});
        sub.onUpdate(function(d){makeUpdate(d);});
        sub.onError(function(e){handleError(e);});
        
        if (isDone){
        sub.unsubscribe();
        } 
        */
        subscribe: function (request) {
            tsReq++;
            var ricData, currencyData, isDone = false;
            var currency = request.currency || "";
            var unit = request.unit || "";
            var isIntraday = request.intervalType && (request.intervalType === "Minute" || (request.intervalType === "Tick")) ? true : false;
            var isGmt = !request.timeZone || request.timeZone === "Gmt" ? true : false;
            if (isIntraday && currency !== "") request.timeZone = "Gmt"; // for currency conversion

            function sub() {
                var subscription,
                    subId,
                    currencySubId,
                    onUp,
                    onEr,

                //wrap request obj
                req = { "requestType": "DataSubscribe" },
                cb = function (d) {
                    var data = JSON.parse(d);
                    if (data.timeSeriesError) {
                        if (onEr) {
                            onEr(data.timeSeriesError);
                        }
                        JET.debug("JET.Data.timeseries error for subid: " + subId, data);
                    }
                    else {
                        if (data.timeSeriesData) {
                            switch (data.timeSeriesData.dataReceptionType) {
                                case "Load":
                                    if (onUp) {
                                        ricData = formatTSData(data);
                                        var length = data.timeSeriesData.records.length;
                                        var tempData = [];
                                        tempData.push(data.timeSeriesData.records[length - 1]);
                                        this._lastRicData = {
                                            "timeSeriesData": {
                                                "records": tempData
                                            }
                                        };

                                        // currency/unit conversion if it's needed
                                        var newData = ricData;
                                        if (currency !== "" && this._currencyInfo) {
                                            if (!isDone) {
                                                var newData = ricData;
                                                if (currencyData) {
                                                    newData = convertDataToNewCurrency(this._currencyInfo, ricData, currencyData);
                                                    if (isIntraday) {
                                                        newData = convertToLocalTimeStamp(newData, this._timeZoneInfo);
                                                    }

                                                    if (unit !== "") {
                                                        newData = convertToTargetUnit(newData, this._allowedConversionObj.records, this._unitMetaData, this._assetInfo.unit, unit);
                                                    }
                                                    onUp(newData);
                                                    isDone = true;
                                                }
                                            }
                                        }
                                        else {// no currency conversion
                                            if (unit !== "") {
                                                newData = convertToTargetUnit(newData, this._allowedConversionObj.records, this._unitMetaData, this._assetInfo.unit, unit);
                                            }
                                            onUp(newData);
                                        }
                                    }
                                    JET.debug("JET.Data.timeseries load response for subid: " + subId, data);
                                    break;
                                case "Update":
                                case "UpdateNewPoint":
                                    if (onUp) {
                                        var formatedData = formatTSData(data);
                                        this._lastRicData = data;

                                        // currency conversion logic
                                        if (this._currencyInfo && currencyData && currencyData.length) {
                                            var lastCurrencyPoint = currencyData[currencyData.length - 1];
                                            formatedData = convertDataToNewCurrency(this._currencyInfo, formatedData, [lastCurrencyPoint]);
                                            if (isIntraday) {
                                                formatedData = convertToLocalTimeStamp(formatedData, this._timeZoneInfo);
                                            }
                                        }
                                        if (unit !== "") {
                                            formatedData = convertToTargetUnit(formatedData, this._allowedConversionObj.records, this._unitMetaData, this._assetInfo.unit, unit);
                                        }
                                        onUp(formatedData);
                                    }
                                    if (data.timeSeriesData.dataReceptionType === 2) // update
                                        JET.debug("JET.Data.timeseries update response for subid: " + subId, data);
                                    else
                                        JET.debug("JET.Data.timeseries update new point response for subid: " + subId, data);
                                    break;
                                case "LoadLastChunk":
                                    if (subId) {
                                        // EikonData.TimeSeries.unsubscribe(subId);
                                        JET.debug("Last chunk received, subId " + subId);
                                    }
                                    break;
                                default:
                                    JET.debug("Unknown response type", data);
                            }
                        } else if (data.timeSeriesStatusChanged) {
                            //to do, handle status changes
                        }
                        else {
                            if (onEr) {
                                onEr("Unknown response");
                            }
                        }
                    }
                };

                var errorHandler = function (err) {
                    if (onEr) {
                        onEr(err);
                    }
                    else {
                        JET.debug("Error: ", err);
                    }
                };

                if (currency === "" && unit === "") {
                    subId = window.top.EikonData.TimeSeries.subscribe(cb);
                    req.data = request;
                    window.top.EikonData.TimeSeries.request(JSON.stringify(req), tsReq, subId);
                }
                else {  // add currency request or unit request
                    getAssetInfo(++tsReq, request.ric).then(function (assetInfo) {
                        this._assetInfo = assetInfo;
                        var timeZone = assetInfo.timeZone;

                        // reset unit
                        unit = this._assetInfo.unit !== 0 ? unit : "";
                        var promises = [];
                        if (currency !== "") {
                            promises.push(getCurrencyMetaData(++tsReq, request.currency));
                            if (isIntraday) {
                                promises.push(getTimeZoneMetaData(++tsReq, timeZone));
                            }
                        }

                        if (unit !== "") {
                            promises.push(getUnitMetaData(++tsReq));
                            // cross category conversion request
                            promises.push(getAssetConversionInfo(++tsReq, request.ric));

                        }

                        Promise.all(promises).then(function (dataArr) {
                            this._currencyInfo = currency !== "" ? dataArr[0] : null;
                            this._timeZoneInfo = this._currencyInfo && isIntraday ? dataArr[1] : null;

                            if (unit !== "") {
                                if (dataArr.length === 2) { // no currency
                                    this._unitMetaData = dataArr[0];
                                }
                                else {
                                    this._unitMetaData = isIntraday ? dataArr[2] : dataArr[1];
                                }
                            }

                            var sourceUnitType = assetInfo.unit;
                            // allowed cross category conversion object, it's the last object in the data array
                            this._allowedConversionObj = dataArr[dataArr.length - 1];

                            // reset ric data request timeZone if currency doesn't exist
                            if (!isGmt && !this._currencyInfo) {
                                request.timeZone = "Instrument";
                            }
                            // add ric time series request
                            subId = window.top.EikonData.TimeSeries.subscribe(cb);
                            req.data = request;
                            subscription.id = subId; // set id for unsubscribe
                            window.top.EikonData.TimeSeries.request(JSON.stringify(req), tsReq, subId);

                            // add currency request
                            if (currency !== "" && this._currencyInfo) {
                                var ric = this._currencyInfo.ric === "" ? (this._currencyInfo.baseCurrency + "=") : this._currencyInfo.ric;
                                var currencyRequest = createCurrencyRequest(request, ric);
                                var currencyReq = { "requestType": "DataSubscribe" };
                                var currencyCb = function (d) {
                                    var data = JSON.parse(d);
                                    if (data.timeSeriesError) {
                                        if (onEr) {
                                            onEr(data.timeSeriesError);
                                        }
                                        JET.debug("JET.Data.timeseries currency data error for subid: " + currencySubId, data);
                                    }
                                    else {
                                        if (data.timeSeriesData) {
                                            switch (data.timeSeriesData.dataReceptionType) {
                                                case "Load":
                                                    if (onUp) {
                                                        currencyData = formatTSData(data);
                                                        // currency conversion if it's needed
                                                        if (this._currencyInfo && ricData && onUp && !isDone) {
                                                            isDone = true;
                                                            var newData = convertDataToNewCurrency(this._currencyInfo, ricData, currencyData);
                                                            if (isIntraday) {
                                                                newData = convertToLocalTimeStamp(newData, this._timeZoneInfo);
                                                            }
                                                            if (unit !== "") {
                                                                newData = convertToTargetUnit(newData, this._allowedConversionObj.records, this._unitMetaData, this._assetInfo.unit, unit);
                                                            }
                                                            onUp(newData);
                                                        }
                                                    }
                                                    break;
                                                case "Update":
                                                case "UpdateNewPoint":
                                                    // check timestamp for currency and see if it exists
                                                    var currencyItem = formatTSData(data)[0];
                                                    var rateIndex = binaryIndexOf(currencyItem.TIMESTAMP, currencyData);
                                                    if (rateIndex === -1) {
                                                        currencyData.push(currencyItem);
                                                    }
                                                    else {
                                                        currencyData[rateIndex] = currencyItem;
                                                    }
                                                    // use last ric data
                                                    if (onUp && this._lastRicData) {
                                                        var tempData = formatTSData(this._lastRicData);
                                                        var formatedData = convertDataToNewCurrency(this._currencyInfo, tempData, [currencyItem]);
                                                        if (isIntraday) {
                                                            formatedData = convertToLocalTimeStamp(formatedData, this._timeZoneInfo);
                                                        }
                                                        if (unit !== "") {
                                                            formatedData = convertToTargetUnit(formatedData, this._allowedConversionObj.records, this._unitMetaData, this._assetInfo.unit, unit);
                                                        }
                                                        onUp(formatedData);
                                                    }
                                                    if (data.timeSeriesData.dataReceptionType === 2) // update
                                                        JET.debug("JET.Data.timeseries update currency response for subid: " + currencySubId, data);
                                                    else
                                                        JET.debug("JET.Data.timeseries update new point currency response for subid: " + currencySubId, data);
                                                    break;
                                                case "LoadLastChunk":
                                                    if (currencySubId) {
                                                        // EikonData.TimeSeries.unsubscribe(subId);
                                                        JET.debug("Last chunk received, subId " + currencySubId);
                                                    }
                                                    break;
                                                default:
                                                    JET.debug("Unknown response type", data);
                                            }
                                        } else if (data.timeSeriesStatusChanged) {
                                            //to do, handle status changes
                                        }
                                        else {
                                            if (onEr) {
                                                onEr("Unknown response");
                                            }
                                        }
                                    }
                                },
                                currencySubId = window.top.EikonData.TimeSeries.subscribe(currencyCb);
                                subscription.currencyId = currencySubId; // set currency id for unsubscribe
                                currencyReq.data = currencyRequest;
                                window.top.EikonData.TimeSeries.request(JSON.stringify(currencyReq), ++tsReq, currencySubId);
                            }

                        }, function (err) { errorHandler(err); });
                    }, function (err) { errorHandler(err); });
                }

                subscription = {
                    id: subId,
                    onUpdate: function (handler) {
                        onUp = handler;
                        return subscription;
                    },

                    onError: function (handler) {
                        onEr = handler;
                        return subscription;
                    },

                    unsubscribe: function () {
                        window.top.EikonData.TimeSeries.unsubscribe(this.id);
                        JET.debug("Unsubscribe subId: ", this.id);
                        // currency unsubscribe
                        if (this.currencyId) {
                            window.top.EikonData.TimeSeries.unsubscribe(this.currencyId);
                            JET.debug("Unsubscribe currrency subId: ", this.currencyId);
                        }
                        return subscription;
                    }

                };
                return subscription;

            }
            return sub();
        }
    };

    return {
        name: "TimeSeries"
    };
});