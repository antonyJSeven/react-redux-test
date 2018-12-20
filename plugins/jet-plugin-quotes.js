/**
    * @namespace
*/
JET.Quotes = {};
/**
    * @class
*/
JET.Quotes.Subscription = {};
(function(){


JET.plugin(function() {
    var lastSubID = 0;
    var baseSubID = ((new Date()).getTime() + "");
    var subscriptions = {};
    var statusMap = {
        0: "PENDING",
        1: "OK",
        2: "STALE",
        3: "INFO",
        4: "CLOSED",
        5: "DELAYED",
        6: "NOPERM",
        7: "REACHLIMIT",
        8: "C_COMPLETE",
        9: "C_CLOSE",
        10: "C_EMPTY",
        11: "C_NOTCHAIN",
        12: "C_ERR",
        13: "C_NOBEGIN",
        14: "C_NOEND"
    };

    JET.onLoad(function() {
        if (JET.ContainerDescription && JET.ContainerDescription.GUID) {
            baseSubID = JET.ContainerDescription.GUID;
        }
    });

    // JET.Quotes.newSubscription()
    // Creates a new blank subscription.
    // The subscription should then be configured. After that it can be started, paused, resumed and finally stoped.
    // Each method returns the subscription object back, so method calls can be chained.
    // Example:
    // var s = JET.Quotes.newSubscription()
    //      .rics(".DJI", "IBM")
    //      .fieldFormat("CF_NETCHNG", 2)
    //      .onUpdate(function(upd) { console.log(upd); })
    //      .start()
    //  ...
    //  s.stop()
    function newSubscription(subscriptionID) {
        // ID generation and management
        var channelID = baseSubID + (lastSubID++);
        var id = typeof(subscriptionID) != 'undefined' ? subscriptionID : channelID;

        if(subscriptions[id]) {
            throw "Subscription with ID = " + id + " already exists";
        }

        // Internal state
        var request = { a: "sub", c: "/MD/" + channelID, ur:1, f : {}, rf : []},//dm:data model, default is mp (marketprice)
        subscriptionHandle = null,
        updateHandler,
        newRowHandler = function(){return;},
        removeRowHandler = function(){return;},
        updateChainHandler,
        batchStartHandler,
        batchFinishHandler,
        errorHandler,
        updateBatch = false,
        isSubscribed = false,
        isPaused = false,
        ricToRowIndex = {},
        rowToRicIndex = [],
        symbolState = {},
        rangeTrackedFields = {},
        isStartPaused = false,
        pauseOnDeactivate = true;

        function lock(f) {
            var queue = [];

            setInterval(function() {
                while(queue.length > 0) {
                    var args = queue.shift();
                    f.apply(args[0], args[1]);
                }
            }, 100);

            return function() {
                queue.push([this, arguments]);
            };
        }


        function callUpdateHandler(ric, fields, index) {
            if (updateHandler) {
                JET.debug("Calling JET.Quotes onUpdate handler. Parameters:", ric, fields, index);
                updateHandler(subscription, ric, fields, index);
            }
        }

        function handleUpdates(multiUpdate) {
            var updates = [];
            for(var updateN = 0; updateN < multiUpdate.length; updateN++) {
                var ricUpdate = multiUpdate[updateN];
                symbolState[ricUpdate.s] = symbolState[ricUpdate.s] || {};
                var ricState = symbolState[ricUpdate.s];
                var rowN = ricToRowIndex[ricUpdate.s];
                if (rowN != null) {
                    var update = {};

                    for(var fieldName in (ricUpdate.u || {})) {
                        var formattedValue = ricUpdate.u[fieldName];

                        ricState[fieldName] = ricState[fieldName] || {};
                        ricState[fieldName].formatted = formattedValue;

                        update[fieldName] = update[fieldName] || {};
                        update[fieldName].formatted = formattedValue;
                    }

                    for(var fieldName in (ricUpdate.ru || {})) {
                        var rawValue = ricUpdate.ru[fieldName];

                        if (rawValue === null) {
                            rawValue = 0;
                        }

                        ricState[fieldName] = ricState[fieldName] || {};
                        ricState[fieldName].raw = rawValue;

                        update[fieldName] = update[fieldName] || {};
                        update[fieldName].raw = rawValue;

                        var minMax = rangeTrackedFields[fieldName];
                        if (minMax) {
                            minMax.min = Math.min(minMax.min, rawValue);
                            minMax.max = Math.max(minMax.max, rawValue);
                        }
                    }

                    if(updateHandler) {
                        updates.push([ricUpdate.s, update, rowN]);
                    }
                }
            }

            // Update handlers invocation is delayed because we want get min/max values only when the whole batch is processed.
            if( updateBatch === true ) {
                callUpdateHandler(updates);
            } else {
                for(var updateN = 0; updateN < updates.length; updateN++) {
                    var upd = updates[updateN];
                    callUpdateHandler(upd[0], upd[1], upd[2]);
                }
            }
        }

        function parseArgumentsList(parameters, optionalType) {
            var args = Array.prototype.slice.call(parameters, 0);

            function throwBadArgs() {
                throw "Invalid arguments. List of strings: f('a','b','c') or array f(['a','b','c']) are supported."
            }

            var result = {
                list : [],
                optional : null
            };

            if (args.length < 1) {
                throwBadArgs();
            }

            if (args !== null && args.length > 0 && typeof args[0] !== "undefined" && Object.prototype.toString.call(args[0]) === '[object Array]') {
                result.list = args.shift();
                for (var n = 0; n < result.list.length; n++) {
                    var item = result.list[n];
                    if (!item || !(typeof item == "string") || item == "") {
                        throwBadArgs();
                    }
                }
            } else {
                while (args.length > 0 && typeof args[0] == "string" && args[0] != "") {
                    result.list.push(args.shift());
                }
            }

            if (optionalType && args.length > 0 && (typeof args[0] == optionalType)) {
                result.optional = args.shift();
            }

            if (args.length > 0) {
                throwBadArgs();
            }

            return result;
        }

        // Public interface
        var subscription = {
            id: id,
            // Adds on or several RICs to the subsription. You can pass strings or arrays of strings.
            // Examples:
            // subscription.rics(".DJI", "IBM")
            // subscription.rics(["MSFT.n", "IBM"])
            /**
             * Add one or several RICs to the subscription. You can pass a list of strings or an array of strings
             * @function rics
             * @memberof JET.Quotes.Subscription
             * @param {(string|Array.<string>)} rics - RICs to subscribe for
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * // Passing a list of strings
             * JET.Quotes.create()
             *   .rics(["JPY=", "EUR=", "GBP="])
             *   .formattedFields("CF_LAST")
             *   .onUpdate(onUpdate)
             *   .start();
             *
             * function onUpdate(subscription, ric, updatedValues) {
             *   // do something
             * };
             *
             * @example
             * // Passing an array of string
             * JET.Quotes.create()
             *   .rics(["JPY=", "EUR=", "GBP="])
             *   .formattedFields("CF_LAST")
             *   .onUpdate(onUpdate)
             *   .start();
             *
             * function onUpdate(subscription, ric, updatedValues) {
             *   // do something
             * };
             */
            rics: function() {

                var params = parseArgumentsList(arguments);

                request.s = (request.s || []).concat(params.list);

                return this;
            },
            // Specifies a chain for the subscription
            // Only one chain can be specified.
            // You can use either rics or chain.
            // Example: subscription.chain("0#.FCHI")
            /**
             * Specifies a chain for the subscription. Only one chain can be specified per Subscription
             * @function chain
             * @memberof JET.Quotes.Subscription
             * @param {string} chain - Chain RIC
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * JET.Quotes.create()
             *   .chain("0#.SETHD")
             *   .formattedFields(["CF_LAST", "PCTCHNG"])
             *   .onNewRow(onNewRow)
             *   .onUpdate(onUpdate)
             *   .start();
             *
             * function onNewRow(subscription, ric, updatedValues, rowN) {
             *   // Add a new row to table
             * }
             * function onUpdate(subscription, ric, updatedValues, rowN) {
             *   // Update data at rowN row
             * }
             */
            chain: function(chain) {
               // checkParameter(chain, "chain", "string");
              //  denyOnStarted();
              //  if (request.s) {
              //      throw "Can't subscribe to both RIC list and a chain";
              //  }

                request.ch = chain;
                return this;
            },

            dataModel: function(dm) {
                //checkParameter(dm, "dm", "string");
             //   denyOnStarted();
                request.dm = dm;
                return this;
            },
            /**
             * Used for specify the DataFeed such as "IDN_RDF", "IDN_SELECTEDFEED"
             * @function feedName
             * @memberof JET.Quotes.Subscription
             * @param {string} df - DataFeed
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * JET.Quotes.create()
             * .rics("JPY=")
             * .formattedFields("CF_LAST")
             * .onUpdate(onUpdate)
             * .feedName("IDN_RDF")
             * .start();
             */
            feedName: function(df) {
                //checkParameter(df, "df", "string");
            //    denyOnStarted();
                request.df = df;
                return this;
            },
            /**
             * Used for specify the KeyLetter such as "Q", "X"
             * @function feedAlias
             * @memberof JET.Quotes.Subscription
             * @param {string} kl - KeyLetter
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * JET.Quotes.create()
             * .rics("JPY=")
             * .formattedFields("CF_LAST")
             * .onUpdate(function () {})
             * .feedAlias("X")
             * .start();
             */
            feedAlias: function(kl) {
              //  checkParameter(kl, "kl", "string");
             //   denyOnStarted();
                request.kl = kl;
                return this;
            },


            // Adds a raw (unformatted) field to the subscription.
            // Example: subscription.rawField("CF_BID")
            /**
             * Add one or several field raw value to the subscription. You can pass a list of strings or an array of strings
             * @function rawFields
             * @memberof JET.Quotes.Subscription
             * @param {(string|Array.<string>)} fields - Field names
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * JET.Quotes.create()
             *   .rics(".DJI")
             *   .rawFields(["BID", "ASK"])
             *   .onUpdate(onUpdate)
             *   .start();
             *
             * function onUpdate (subscription, ric, updatedValues) {
             *   if (updatedValues["BID"]) {
             *     // Do something
             *   }
             *
             *   if (updatedValues["ASK"]) {
             *     // Do something
             *   }
             * }
             */
            rawFields: function(fields) {
             //   denyOnStarted();

                var params = parseArgumentsList(arguments);

                params.list.forEach(function(field) {
                    for(var n = 0; n < request.rf.length; n++) {
                        if (request.rf[n] == field) {
                            return this;
                        }
                    }

                    request.rf.push(field);

                    if (!(field in request.f)) {
                        request.f[field] = "";
                    }
                });

                return this;
            },
            // Adds a formatted field to the subscription.
            // The second optional parameter specifies decimal precision.
            // Examples:
            //      subscription.formattedField("CF_NETCHNG")
            //      subscription.formattedField("CF_LAST", 2)
            /**
             * Add one or several field formatted value to the subscription. You can pass a list of strings or an array of strings
             * @function formattedFields
             * @memberof JET.Quotes.Subscription
             * @param {(string|Array.<string>)} fields - Field names
             * @param {number} [precision] - Fixed decimal places.
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * // Passing list of string
             * JET.Quotes.create()
             *   .rics(".DJI")
             *   .formattedFields(["BID", "ASK"])
             *   .onUpdate(onUpdate)
             *   .start();
             *
             * function onUpdate (subscription, ric, updatedValues) {
             *   if (updatedValues["BID"]) {
             *     // Do something
             *   }
             *
             *   if (updatedValues["ASK"]) {
             *     // Do something
             *   }
             * }
             *
             * @example
             * // Passing array of string and precision
             * JET.Quotes.create()
             *   .rics(".DJI")
             *   .formattedFields(["BID", "ASK"], 2)
             *   .onUpdate(onUpdate)
             *   .start();
             *
             * function onUpdate (subscription, ric, updatedValues) {
             *   if (updatedValues["BID"]) {
             *     // Do something
             *   }
             *
             *   if (updatedValues["ASK"]) {
             *     // Do something
             *   }
             * }
             */
            formattedFields: function(fields) {

                var params = parseArgumentsList(arguments, "number");

                var format = "";

                if (params.optional != null) {
                    format = "%." + Math.floor(params.optional) + "f";
                }

                params.list.forEach(function(field) {
                    request.f[field] = format;
                });

                return this;
            },
            // Enables tracking of min/max values for certain fields.
            // Min and max values can be obtain with getMin/getMax function after subscription will be started.
            /**
             * Add one or several field that you want to enable the range tracking. You can pass a list of string or an array of strings
             * @function rangeTracking
             * @memberof JET.Quotes.Subscription
             * @param {(string|Array.<string>)} fields - Field name
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * JET.Quotes.create()
             *   .rics(["PTT.BK", "BBL.BK", "BAY.BK", "LH.BK", "CPALL.BK"])
             *   .rawFields(["DSPLY_NAME", "PCTCHNG"])
             *   .rangeTracking("PCTCHNG")    // enable range tracking for PCTCHNG field
             *   .onUpdate(onUpdate)
             *   .start();
             *
             * function onUpdate(subscription, ric, updatedValues, rowN) {
             * };
             */
            rangeTracking: function(fields) {
                var params = parseArgumentsList(arguments);
                params.list.forEach(function(field){
                      rangeTrackedFields[field] = {
                        min: Infinity,
                        max: -Infinity
                    };
                });

                return this;
            },
            // Specifies sorting options for the subscription
            // The second optional parameter specifies sorting direction: 0 for Ascending, 1 for descending
            // Example:
            //      subsciption.sort("CF_NAME", 1) // Sort by CF_NAME descending
            /**
             * Specifie sorting options for the subscription
             * @function sort
             * @memberof JET.Quotes.Subscripiton
             * @param {string} field - Field name
             * @param {number} [direction] - 0: Ascending, 1: Descending. Default is Ascending.
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * JET.Quotes.create()
             *   .rics(["PTT.BK", "BBL.BK", "CPALL.BK"])
             *   .formattedFields(["CF_LAST", "PCTCHNG"])
             *   .sort("PCTCHNG", 1)    // Sorting by PCTCHNG column, descending
             *   .onUpdate(onUpdate)
             *   .start();
             */
            sort: function(field, direction) {
              /*  checkParameter(field, "field", "string");
                checkParameter(direction, "direction", "number", true);
                denyOnStarted();*/

                request.sf = field;
                request.sd = (direction == 1) ? 1 : 0;
                return this;
            },

            // Specifies range filter for the subscription
            // Example:
            //      subscription.filter(2,10) // Display 10 records starting from record #2 (counting from 0)
            /**
             * Filter the chain to display data with limited records
             * @function
             * @memberof JET.Quotes.Subscription
             * @param {number} start - A starting record that will be displayed
             * @param {number} count - Number of record that will be displayed
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * JET.Quotes.create()
             *   .chain("0#.SETHD")
             *   .filter(1, 10)
             *   .formattedFields(["CF_LAST", "PCTCHNG"])
             *   .onUpdate(onUpdate)
             *   .start();
             */
            filter: function(start, count) {
               /* checkParameter(start, "start", "number");
                checkParameter(count, "count", "number");
                denyOnStarted();*/

                request.bi = start;
                request.di = count;
                return this;
            },
            /**
             * A callback function for Subscription's onUpdate()
             * @callback JET.Quotes.Subscription~subscriptionCallback
             * @param {JET.Quotes.Subscription} subscription -The subscription object. Can be used to query additional data
             * @param {string} ric - The updated RIC
             * @param {object} updatedValues - The object that contains value of available fields
             * @param {rowN} number - Table row number
             */

            /**
             * Use for register a callback function to be called when data is updated
             * @function
             * @memeberof JET.Quotes.Subscription
             * @param {JET.Quotes.Subscription~subscriptionCallback} handler - A callback function to be called when data is updated
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * JET.Quotes.create()
             *   .rics(".DJI")
             *   .formattedFields(["BID", "ASK"])
             *   .rawFields(["BID", "ASK"])
             *   .onUpdate(onUpdate)
             *   .start();
             *
             * function onUpdate (subscription, ric, updatedValues, rowN) {
             *   if (updatedValues["BID"]) {
             *     var bid_raw = updatedValues["BID"].raw;
             *     var bid_formatted = updatedValues["BID"].formatted;
             *   }
             *
             *   if (updatedValues["ASK"]) {
             *     var ask_raw = updatedValues["ASK"].raw;
             *     var ask_formatted = updatedValues["ASK"].formatted;
             *   }
             * }
             */
            onUpdate: function(handler, batch) {
              //  checkParameter(handler, "handler", "function");
                updateBatch = (batch === true) ? true : false;
                updateHandler = handler;
                return this;
            },


            /**
             * A callback function for a chain update.
             * @function
             * @memeberof JET.Quotes.Subscription
             * @param  handler - A callback function to be called when chain is updated
             * @return {JET.Quotes.Subscription} returns current subscription
             */
            onChainUpdate: function(handler) {
          //  checkParameter(handler, "handler", "function");
                updateChainHandler = handler;
                return this;
            },

            onBatchStart: function(handler) {
        //    checkParameter(handler, "handler", "function");
                batchStartHandler = handler;
                return this;
            },
            onBatchFinish: function(handler) {
           //     checkParameter(handler, "handler", "function");
                batchFinishHandler = handler;
                return this;
            },
            onError: function(handler) {
                //checkParameter(handler, "handler", "function");
                errorHandler = handler;
                return this;
            },
            /**
             * Start a subscription
             * @function start
             * @memberof JET.Quotes.Subscription
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * subscription.start();
             */
            start: function() {
                //make async
                if (!JET.Loaded) {
                    JET.onLoad(this.start);
                    return this;
                }


                if (!isSubscribed) {

                    var c = JET.ContainerDescription;
                    if (c.major<8?0:(c.minor == 0 && c.build < 55?0:1))
                    {
                     //   if (!JET.isActive())
                     //   {
                     //       isStartPaused = true;
                     //       return this;
                     //   }
                    }
                    //Fill row numbers lookup for static RICs sets
                    var rics = (request.s || []);
                    for(var ricN = 0; ricN < rics.length; ricN++) {
                        ricToRowIndex[rics[ricN]] = ricN;
                    }
                    var sub = this,
                    handleEvents = function(events) {
                        events.forEach(function(e){
                            var ricState = symbolState[e.s] || {};
                            switch(e.e) {
                                case 0: // Add item
                                       while(e.i > rowToRicIndex.length) {
                                            newRowHandler.call(window, subscription, null,{},rowToRicIndex.length);
                                            rowToRicIndex.push(null);
                                        }

                                        ricToRowIndex[e.s] = e.i;
                                        rowToRicIndex[e.i] = e.s;

                                        if (e.i == rowToRicIndex.length - 1) {
                                            newRowHandler.call(window,subscription, e.s, ricState, e.i);
                                        } else {
                                            updateHandler.call(window, subscription, e.s, ricState, e.i);
                                        }
                                    break;
                                case 1: // Remove item
                                        delete ricToRowIndex[e.s];

                                        if(removeRowHandler) {
                                            JET.debug("Calling JET.Quotes onRemoveRow handler. Parameters:", e.s, ricState, e.i);
                                            removeRowHandler.call(window, subscription, e.s, ricState, e.i);
                                        }
                                    break;
                                case 2: // Update row
                                        if (e.ps && ricToRowIndex[e.ps] == e.i) {
                                            delete ricToRowIndex[e.ps];
                                        }
                                        ricToRowIndex[e.s] = e.i;
                                        rowToRicIndex[e.i] = e.s;

                                        updateHandler.call(window, subscription, e.s, ricState, e.i);
                                    break;
                            }
                        });
                    },
                    mainHandler = function(event) {
                        // Can't use this because of invalid JSON data sent by the desktop
                        // var data = JSON.parse(event);
                        var data = eval("(function(){return " + event + ";})()");
                        if (data.a === "e") {
                            handleEvents(data.me);
                        } else if (data.a === "u") {
                            if (batchStartHandler && data.mu.length > 1) {
                                batchStartHandler();
                            }
                            handleUpdates(data.mu);
                            if (batchFinishHandler && data.mu.length > 1) {
                                batchFinishHandler();
                            }
                        } else if (data.a == "s") {
                            if (data.s) { // Symbol status
                                symbolState[data.s] = symbolState[data.s] || {};
                                var state = symbolState[data.s];
                                var status = {
                                            formatted: statusMap[data.st],
                                            raw: data.st
                                        };
                                state["STATUS"] = status;
                                rowN = ricToRowIndex[data.s];
                                if (rowN != null) {
                                    if (updateHandler) {
                                        updateHandler(subscription, data.s, {
                                            "STATUS" : status
                                        }, rowN);
                                    }
                                }
                            } else { // TODO: Chain status
                                if (updateChainHandler) {
                                    var status = {
                                        formatted: statusMap[data.st],
                                        raw: data.st
                                    };
                                    updateChainHandler(subscription, data.ch, { "STATUS" : status });
                                }
                            }
                        } else if(data.a == 'gme') {
                            //{"a":"gme","err":{"errorcode":x,"description":"xxx"}}
                            if(errorHandler) errorHandler(subscription, data.err.errorcode, data.err.description);
                        }
                    };

                    subscriptionHandle = JET.subscribe(request.c, mainHandler);
					JET.publish("/MD/ControlChannel", JSON.stringify(request));
                    isSubscribed = true;
                    isPaused = false;
                    isStartPaused = false;
                }
                return this;
            },
            /**
             * Stop a subscription
             * @function stop
             * @memberof JET.Quotes.Subscription
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * subscription.stop();
             */
            stop: function() {
                if (isSubscribed) {
					JET.publish("/MD/ControlChannel", JSON.stringify({ "a": "unsub", "c": request.c }));
                    subscriptionHandle.unsubscribe();
                    isPaused = false;
                    isSubscribed = false;
                    isStartPaused = false;
                }
                return this;
            },

            /**
             * Use for register a callback function to be called when a new row should be added to the table. It should be added at the bottom of the table
             * @function onNewRow
             * @memberof JET.Quotes.Subscription
             * @param {JET.Quotes.Subscription~subscriptionCallback} handler - A callback function to be called when a new row should be added to the table
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * JET.Quotes.create()
             *   .chain("0#.SETHD")
             *   .formattedFields(["CF_LAST", "PCTCHNG"])
             *   .onNewRow(onNewRow)
             *   .onRemoveRow(onRemoveRow)
             *   .onUpdate(onUpdate)
             *   .start();
             *
             * function onNewRow(subscription, ric, updatedValues, rowN) {
             *   // Add a new row to table
             * }
             *
             * function onRemoveRow(subscription, ric, updatedValues, rowN) {
             *   // Remove the last row from the table
             * }
             *
             * function onUpdate(subscription, ric, updatedValues, rowN) {
             *   // Update data at rowN row
             * }
             */
            onNewRow: function(handler) {
                newRowHandler = handler;
                return this;
            },

            /**
             * Use for register a callback function to be called when a last row of the table should be removed
             * @function onRemoveRow
             * @memberof JET.Quotes.Subscription
             * @param {JET.Quotes.Subscription~subscriptionCallback} handler - A callback function to be called when a last row of the table should be removed
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * JET.Quotes.create()
             *   .chain("0#.SETHD")
             *   .formattedFields(["CF_LAST", "PCTCHNG"])
             *   .onNewRow(onNewRow)
             *   .onRemoveRow(onRemoveRow)
             *   .onUpdate(onUpdate)
             *   .start();
             *
             * function onNewRow(subscription, ric, updatedValues, rowN) {
             *   // Add a new row to table
             * }
             *
             * function onRemoveRow(subscription, ric, updatedValues, rowN) {
             *   // Remove the last row from the table
             * }
             *
             * function onUpdate(subscription, ric, updatedValues, rowN) {
             *   // Update data at rowN row
             * }
             */
            onRemoveRow: function(handler) {
                removeRowHandler = handler;
                return this;
            },

            /**
             * Pause a subscription
             * @function pause
             * @memberof JET.Quotes.Subscription
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * subscription.pause();
             */
            pause: function() {
                if(isSubscribed && !isPaused) {
					JET.publish("/MD/ControlChannel", JSON.stringify({ "a": "p", "c": request.c }));
                   isPaused = true;
                }
                return this;
            },

            sendGenericMessage: function(msgName,msgPayload) {
                if(isSubscribed && !isPaused) {
					JET.publish("/MD/ControlChannel", JSON.stringify({ "a": "sendgenmsg", "msgname": msgName, "msgpayload": msgPayload, "s": request.s, "c": request.c}));
                }
                return this;
            },

            /**
             * Resume a subscription
             * @function resume
             * @memberof JET.Quotes.Subscription
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * subscription.resume();
             */
            resume: function() {
                if (isStartPaused) this.start();
                else if (isSubscribed && isPaused) {
					JET.publish("/MD/ControlChannel", JSON.stringify({ "a": "r", "c": request.c }));
                    isPaused = false;
                }
                return this;
            },
            /**
             * Used for specify whether you want to pause a subscription when a page is deactivated
             * @function pauseOnDeactivate
             * @memberof JET.Quotes.Subscription
             * @param {boolean} isPausedOnDeactivate - True (Default) - Subscription will be automatically paused when page is deactivated. False - Subscription will not be paused when page is deactivated.
             * @return {JET.Quotes.Subscription} return A current subscription
             *
             * @example
             * subscription.pauseOnDeactivate(false);
             */
            pauseOnDeactivate: function(isPausedOnDeactivate) {
                pauseOnDeactivate = isPausedOnDeactivate;
                return this;
            },

            // Activate the subscription (used when the app is activated)
            activate: function() {
                if (pauseOnDeactivate) {
                    this.resume();
                }
                return this;
            },

            // De-Activate the subscription (used when the app is deactivated)
            deactivate: function() {
                if (pauseOnDeactivate) {
                    this.pause();
                }
                return this;
            },

            /**
             * Get all known fields values for the specified ric
             * @function getFieldsValues
             * @memberof JET.Quotes.Subscription
             * @param {string} ric - RIC
             * @return {object} fieldsValues return The object that contains values of every fields
             *
             * @example
             * var fieldsValues = subscription.getFieldsValues("EUR=");
             */
            getFieldsValues: function(ric) {
                if (ric) {
                    return symbolState[ric];
                } else {
                    return {};
                }
            },
            /**
             * Get minimum and maximum values of specified field over all RICs
             * @function getRange
             * @memberof JET.Quotes.Subscription
             * @param {string} field - Field name
             * @return {object} return An object with min and max fields e.g. {min: -10, max: 23}
             *
             * @example
             * subscription.onUpdate(function(subscription, ric, updatedValues, rowN) {
             *   var range = subscription.getRange("PCTCHNG");
             *   var min = range.min;
             *   var max = range.max;
             * })
             */
            getRange: function(field) {
             //  checkParameter(field, "field", "string");
               return rangeTrackedFields[field];
            },

            getLineRic: function(line) {
               //checkParameter(ric, "line", "number");
               return rowToRicIndex[line];
            }
        };

        // Stop on window reload/close; pause/resume on window visibility changes.

        JET.onUnload(function() { subscription.stop(); });

        if (JET.onActivate) {
			JET.onActivate(function () {
				subscription.activate();
			});
		}

        if (JET.onDeactivate) {
			JET.onDeactivate(function () {
				subscription.deactivate();
			});
		}

        subscriptions[id] = subscription;

        if (Object.freeze) {
           Object.freeze(subscription);
        }

        return subscription;
    }

    function feedStatusChangeHandler(feedNames, handler) {
        var subId = lastSubID++;
        var channelID = baseSubID + subId;
        var subHandle = null;
        var feedRequest = { a: "listenservicestatus", c: "/MD/fea" + channelID};
        feedRequest.services = feedNames;

        var subHandler = function(event) {
            // Can't use this because of invalid JSON data sent by the desktop
            // var data = JSON.parse(event);
            var data = eval("(function(){return " + event + ";})()");

            if(data.a === 'servicestatusevent') {
                // {"a":"servicestatusevent","c":"/MD/fea43fb1f55a41c0990366ad90e222920","events":[{"key":"Q","name":"IDN_RDF","state":"up"}]}
                handler(data.events);
            }
            else {
                JET.debug("Error: " + event);
            }
        };

        subHandle = JET.subscribe(feedRequest.c, subHandler);
		JET.publish("/MD/ControlChannel", JSON.stringify(feedRequest));

        var subscription = {
            id: lastSubID,
            unsubscribe: function () {
                // stop listening
                JET.publish("/MD/ControlChannel", JSON.stringify({ "a": "unlistenservicestatus", "c": feedRequest.c }));
                subHandle.unsubscribe();
            }
        };
        return subscription;
    }

    return {
        name:"Quotes",
        api:{
            "Quotes":{
                /**
                 * Instantiates a new Market Data Subscription
                 * @function create
                 * @memberof JET.Quotes
                 * @param {string} [subscriptionID] - ID of the subscription
                 * @return {JET.Quotes.Subscription} return A new Market Data Subscription
                 *
                 * @example
                 * var subscription = JET.Quotes.create();
                 */
                create : newSubscription,
                /**
                 * Getting a subscription from a subscription ID.
                 * @function get
                 * @memberof JET.Quotes
                 * @param {string} subscriptionID - ID of the subscription
                 * @return {JET.Quotes.Subscription} return A subscription
                 *
                 * @example
                 * JET.Quotes.create("myID");
                 * var mySubscription = JET.Quotes.get("myID");
                 */
                get : function(subscriptionID) {
                    return subscriptions[subscriptionID];
                },

                /**
                 * A callback function for a feed status changed.
                 * @function onFeedStatusChanged
                 * @memberof JET.Quotes
                 * @param {Array.<string>} feedNames an array of specific feed names or ['*'] for all feeds
                 * @param  callbackHandler - A callback function to be called when feed status is updated
                 * @return {Object} return A Subscription
                 * @example
                 * var subscription = JET.Quotes.onFeedStatusChanged(["L", "Q"], statusChangeHandler);
                 * subscription.unsubscribe(); // if it's needed
                 */
                onFeedStatusChanged: function(feedNames, callbackHandler) {
                    return feedStatusChangeHandler(feedNames, callbackHandler);
                }

            }
        }
    };
});
})();
