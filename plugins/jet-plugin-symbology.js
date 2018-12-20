/**
 * Request object for JET.Data.Symbology request
 * @typedef {Object} DataSymbologyRequest
 * @example
 * {"From": "RIC","Symbols": ["IBM.N"],"Limit": 5}
 * {"From": "RIC","To": ["ISIN"],"Symbols": ["IBM.N"]}
 * {"From": "ISIN","Symbols": ["US4592001014","ARDEUT110202"],"Limit": 5}
 * {"From": "Ticker","Symbols": ["VOD"],"Limit": 5}
 */

/**
 * A callback function to be called when data is successfully returned
 * @callback DataCallback
 * @param {Object} - data response
 * @example
 * {"MappedSymbols":[{"BestMatch":{"CUSIP":"459200101","ISIN":"US4592001014","RIC":"IBM.N","SEDOL":"2005973","Ticker":"IBM"},"CUSIPs":["459200101"],"ISINs":["US4592001014"],"RICs":["IBM.N"],"SEDOLs":["2005973"],"Symbol":"IBM.N","Tickers":["IBM"]},{"BestMatch":{"Error":"Failed to resolve symbol foo. No data returned from Search"},"Error":"Unknown symbol","Symbol":"foo"}]}
 */

JET.plugin(function () {
    // Create JET.Data namespace if it doesn't exist
    if (JET.Data === undefined) {
        JET.Data = {};
    }

    /**
    * @namespace
    */
    // Symbology data API
    JET.Data.Symbology = {
        /**
         * Request data from the JET Container
         * @function request
         * @memberof JET.Data.Symbology
         * @param {Object} request - The request object
         * @returns {Promise}  Promise object accepting resolve and reject callbacks
         * @example 
         * function resolve(d){
         *     var cusip = d.MappedSymbols[0].CUSIPs[0];
         *     //do something
         * }
         *
         * var symbPromise = JET.Data.Symbology.request({"from": "RIC","symbols": ["IBM.N"],"limit": 5});
         * symbPromise.then(resolve, reject); 
         *
         * // Map a single RIC to all related symbols:
         * //     {"from": "RIC","symbols": ["IBM.N"]}
         * // Map multiple RICs to all related symbols:
         * //     {"from": "RIC","symbols": ["IBM.N", "AAPL.O"]}
         * // Map a single RIC to an ISIN:
         * //     {"from": "RIC", "to":["ISIN"], "symbols": ["IBM.N"]}
         * // Map an ISIN to RIC:
         * //     {"from": "ISIN", "to":["RIC"], "symbols": ["US4592001014"]}
         */
        request: function (request) {
            return new Promise(function (resolve, reject) {
                var requestMessage = JSON.stringify({
                    Entity: {
                        Id: "SS",
                        E: "SymbologySearch",
                        W: request
                    }
                });

                var callback = function (e) {
                    var result = null;
                    try {
                        JET.debug("JET.Data.Symbology:", e);
                        result = JSON.parse(e).SS;
                    }
                    catch (ex) {
                    }

                    if (result != null) {
                        resolve(result);
                    }
                    else {
                        reject("Unable to get symbology data from container.");
                    }
                }

                window.top.EikonData.Symbology(requestMessage, callback);
            });
        }
        };
		return {
			name:"Symbology"
		};		
});