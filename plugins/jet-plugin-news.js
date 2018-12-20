/**
    @namespace
*/
JET.News = {};
/**
    @class
*/
JET.News.Subscription = {};

JET.plugin(function() {
    var subscriptions = {};
    var lastSubID = 0;
    var baseSubID = ((new Date()).getTime() + "");
    var desktopVersion = "1.0.0.0";
    var applyWorkarounds = true;

    var loaded = false;
    var loadedHandlers = [];
    var settings = {
        nativeMultiQueries: false
    };

    /**
     * We have a crappy JSON parsing using eval because the desktop might send malformed JSON
     *
     * @param json string
     * @return {Object}
     */
    function parseJSON(json) {
        return eval("(function(){return " + json + ";})()");
    }

    function onLoad(handler) {
        if (loaded) {
            handler();
        }
        else {
            loadedHandlers.push(handler);
        }
    }

    function init() {

        function loadSettings() {
            JET.subscribe("/News/" + baseSubID + 'settings', function (eventObj) {
                var data = parseJSON(eventObj);
                if (data.a === "settings") {
                    for (var key in data.settings) {
                        settings[key] = data.settings[key];
                    }
                    settings.nativeMultiQueries = data['newsApiEnable'];

                    loaded = true;
                    loadedHandlers.forEach(function (handler) {
                        handler();
                    });
                }
            });
            JET.publish("/News/ControlChannel", JSON.stringify({
                a: "settings",
                c: "/News/" + baseSubID + 'settings'
            }));
        }

        JET.onLoad(function () {
            if (JET.ContainerDescription && JET.ContainerDescription.GUID) {
                baseSubID = JET.ContainerDescription.GUID;
            }

            // obtain version and settings
            var version = JET.ContainerDescription;
            var areSettingsAvailable = false;

            // Eikon now always support settings
            if (version.name === 'EikonNowContainer') {
                areSettingsAvailable = true;
            }
            // Eikon desktops supports setting starting from
            else {
                if (version.major < 9) {
                    areSettingsAvailable = false;
                }
                else if (version.major > 9) {
                    areSettingsAvailable = true;
                }
                else {
                    if (version.minor > 0) {
                        areSettingsAvailable = true;
                    }
                    else {
                        areSettingsAvailable = version.build >= 28465;
                    }
                }
            }

            JET.subscribe("/News/" + baseSubID, function (eventObj) {
                var data = parseJSON(eventObj);
                if (data.a === "v") {
                    desktopVersion = data.v;
                    applyWorkarounds = false;

                    if (!areSettingsAvailable) {
                        loaded = true;
                        loadedHandlers.forEach(function (handler) { handler(); });
                    }
                }
            });
            JET.publish("/News/ControlChannel", JSON.stringify({a: "v", c: "/News/" + baseSubID, v: ""}));

            if (areSettingsAvailable) {
                loadSettings();
            }
        });
    }

    // Check before sending the appHit
    function sendAppHit(Title, Extend) {
        if (JET.appHit && JET.ID) {
            var id = JET.ID;
            if (Title.length + id.length + Extend.length > 40) {
                var NbElem = 40 - (Title.length + Extend.length);
                id = id.substr(0, NbElem);
            }

            JET.appHit("JETNews", "ve", Title + id + Extend);
        }
    }

    //Current number of items in top and bucket

    //helper function, allows to check presence and type of passed parameters
    //params: value - parameter value to check
    //paramName - name of parameter, is needed for error message
    //type - string that represents expected type of parameter
    //optional boolean value that indicate if parameter is optional
    function checkParameter(value, paramName, type, optional) {
        if (optional && typeof (value) == "undefined") {
            return;
        }
        if (value === "" || value === null || typeof (value) !== type) {
            throw "Invalid argument. Parameter '" + paramName + "' must be a " + type
        }
    }

    function parseArgumentsList(parameters, optionalType) {
        var args = Array.prototype.slice.call(parameters, 0);

        function throwBadArgs() {
            throw "Invalid arguments. List of strings: f('a','b','c') or array f(['a','b','c']) are supported."
        }

        var result = {
            list: [],
            optional: null
        };

        if (args.length < 1) {
            throwBadArgs();
        }

        if (args !== null && args.length > 0 && typeof args[0] !== "undefined" && args[0].constructor == Array) {
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

    function makeTokensForwardCompatible(tokens) {
        if (!(tokens instanceof Array)) {
            for (var key in tokens) {
                makeTokensForwardCompatible(tokens[key]);
            }

            return;
        }

        if (tokens.length && tokens[0].id) {
            return;
        }

        tokens.forEach(function(t) {
            switch (t.t) {
                case 0: // TOPIC
                    t.category = 'Topic';
                    t.id = t.c;
                    t.label = t.d;
                    t.readable = t.c;
                    t.input = t.e;
                    break;
                case 1: // RIC
                    t.category = 'Instrument';
                    t.id = t.c;
                    t.label = t.c.split(':').pop();
                    t.readable = t.c;
                    t.input = t.e;
                    break;
                case 2: // FreeText
                    var cleanedValue = t.e.replace(/^"*(.*?)"*$/, '$1');

                    t.category = 'FreeText';
                    t.id = '"' +cleanedValue + '"';
                    t.label = cleanedValue;
                    t.readable = '"' + cleanedValue + '"';
                    t.input = cleanedValue;
                    break;
                case 3: // Portfolio
                    t.category = 'Portfolio';
                    t.id = 'PF:"' + t.c.replace('"', '') + '"';
                    t.label = t.c;
                    t.readable = 'PF:"' + t.c.replace('"', '') + '"';
                    t.input = t.e;
                    break;
                case 4: // Operator
                case 5: // Operator, blocks
                    t.category = 'Operator';
                    t.id = t.c == 'NEAR' ? 'AND' : t.c;
                    t.label = t.c == 'NEAR' ? 'AND' : t.c;
                    t.readable = t.c == 'NEAR' ? 'AND' : t.c;
                    t.input = t.c == 'NEAR' ? 'AND' : t.c;
                    break;
                case 6: // SearchIn
                    t.category = 'SearchIn';
                    t.id = 'SearchIn:' + t.d;
                    t.label = 'Search In ' + t.d;
                    t.readable = 'SearchIn:' + t.d;
                    t.input = 'SearchIn:' + t.d;
                    break;
                case 7: // DateRange
                    t.tz = t.tz || '+00:00';

                    if (t.b && !t.b.t) {
                        t.b.t = '00:00:00';
                    }
                    if (t.e && !t.e.t) {
                        t.e.t = '23:59:59';
                    }

                    var begenning = t.b ? (t.b.d + 'T' + t.b.t + t.tz.replace(':', '')) : '';
                    var end = t.e ? (t.e.d + 'T' + t.e.t + t.tz.replace(':', '')) : '';

                    t.category = 'DateRange';
                    t.id = t.readable = t.input = begenning + '/' + end;

                    // between
                    if (t.e && t.e.s && t.b && t.b.s) {
                        t.label = 'between ' + t.b.d  + ' ' + t.b.t + ' and ' + t.e.d  + ' ' + t.e.t + ' (' + t.tz + ')';
                    }
                    // before
                    else if (t.e && t.e.s) {
                        t.label = 'before ' + t.e.d  + ' ' + t.e.t + ' (' + t.tz + ')';
                    }
                    // after
                    else {
                        t.label = 'after ' + t.b.d  + ' ' + t.b.t + ' (' + t.tz + ')';
                    }
                    break;
                case 8: // Ticker
                    t.category = 'Instrument';
                    t.id = t.c;
                    t.label = t.c.split(':').pop();
                    t.readable = t.c;
                    t.input = t.e;
                    break;
            }
        });
    }

    function resolve(newsExpression, resolveCallback, returnOptions) {
        if (!loaded) {
            loadedHandlers.push(function() { resolve(newsExpression, resolveCallback, returnOptions); });
            return;
        }

        if (!JET.Loaded) throw new Error("JET.News cannot resolve any expression until JET is fully loaded !");
        if (!resolveCallback) throw new Error("Incorrect usage : JET.News.resolve needs a callback to notify upon resolving expression.");
        checkParameter(resolveCallback, "resolveCallback", "function");

        // if we ask for a multi query and the desktop API does not support it, we have to simulate it
        if (typeof newsExpression == 'object' && !settings.nativeMultiQueries) {
            var result = {
                expressionDescription: "",
                expressionTokens: {},
                extras: {}
            };

            // as emulation is consuming lots of perfs, lets skip empty ones
            var emptyExpressions = Object.keys(newsExpression).filter(function(key) { return !newsExpression[key]; });
            var validExpressions = Object.keys(newsExpression).filter(function(key) { return !!newsExpression[key]; });

            // fill in responses for empty queries
            emptyExpressions.forEach(function(key) {
                result.expressionTokens[key] = [];
                result.extras[key] = [{ "r": 0, "c": "", "e": "" }];
            });

            // if we got all the responses, let prematurely answer
            if (!validExpressions.length) {
                resolveCallback(result);
            }
            // else, lets reroute the remaining queries to simple request
            else {
                validExpressions.forEach(function (key) {
                    resolve(newsExpression[key], function (subResult) {
                        result.expressionDescription += (result.expressionDescription ? ' AND ' : '') + '( ' + subResult.expressionDescription + ' )';
                        result.expressionTokens[key] = subResult.expressionTokens;
                        result.extras[key] = subResult.extras;

                        if (Object.keys(result.expressionTokens).length == Object.keys(newsExpression).length) {
                            resolveCallback(result);
                        }
                    }, returnOptions);
                });
            }

            return;
        }


        var id = baseSubID + (lastSubID++);
        var newsParams = {
            a: "aod",
            e: newsExpression,
            c: "/News/" + id
        };
        if (returnOptions != undefined) {
            checkParameter(returnOptions, "returnOptions", "object");
            newsParams.t = {
                l: !!returnOptions.languagesInDescription,
                t: !!returnOptions.languagesInTokens,
                c: !!returnOptions.commandLineContent,
                e: !!returnOptions.expertExpression
            };
            if ('dataSource' in returnOptions) {
                newsParams.t.s = returnOptions.dataSource;
            }
        }

        var subscriptionHandle = JET.subscribe(newsParams.c, function (eventObj) {
            var data = parseJSON(eventObj);

            // enrich data for FC
            makeTokensForwardCompatible(data.s);

            resolveCallback({expressionDescription:data.m, expressionTokens:data.s, extras:data.x});

            subscriptionHandle.unsubscribe();
        });
        JET.publish("/News/ControlChannel", JSON.stringify(newsParams));
    }

    // JET.News.NewSubscription()
    // Creates a new blank subscription. 
    // Then, the subscription should be configured. After that it can be paused, resumed,  stoped and so on.
    // Each method returns the subscription object back, so methods can be chained.
    // Example:
    // var s = JET.News.NewSubscription()
    //      .newsExpression("LEN")
    //      .basketSize(5)
    //      .SetNewsHandler(function(upd) { console.log(upd); })
    //      .Start()
    //  ...
    //  s.Stop()

    function newSubscription(subID) {
        // ID generation and management
        var id = subID ? subID : baseSubID + (lastSubID++);
        var restartID = 0;
        if (subscriptions[id] !== undefined) {
            throw "Subscription with ID = " + id + " already exists";
        }
        //private members
        var isSubscribed = false;
        var newsParams = {
            a: "sub",
            top: 1,
            b: 10,
            t: JET.News.newTemplate().getRawTemplate(),
            hh: "",
            hk: 1,
            hkl: "",
            dt: "dd-MMM-yyyy",
            tt: "hh:mm:ss"
        };
        var itemsCount = [0, 0];
        var maxCounts = [0, 0];

        var newsHandler;
        var appendHandler;
        var insertHandler;
        var deleteHandler;
        var clearHandler;
        var titleChangeHandler;
        var queryResolvedHandler;
        var showNewsServiceStatusHandler;
        var showSubscriptionStatusHandler;
        var historicalNewsReceivedHandler;
        var subscriptionHandle;
        var isIndividualHandlersSet = false;
        var isCommonHandlerSet = false;
        var dateRangeExpression = "";
        var isStartPaused = false;

        function callInsertOrUpdate(command) {
            if (command.i == itemsCount[command.tt]) {
                if (appendHandler) {
                    JET.debug("Calling JET.News append handler. i:", command.i, " tt:", command.tt, " ht:", command.ht, " h:", command.h);
                    appendHandler(command);
                }
            } else if (insertHandler) {
                JET.debug("Calling JET.News insert handler. i:", command.i, " tt:", command.tt, " ht:", command.ht, " h:", command.h);
                insertHandler(command);
            }
        }

        function callDeleteHandler(command) {
            if (deleteHandler) {
                JET.debug("Calling JET.News delete handler. i:", command.i, " tt:", command.tt);
                deleteHandler(command);
            }
        }

        function callClearHandler(command) {
            if (clearHandler) {
                JET.debug("Calling JET.News clear handler. tt:", command.tt);
                clearHandler(command);
            }
        }

        function deleteExcessHeadlines(limit) {
            for (var n = 0; n < 2; n++) {
                while (itemsCount[n] > limit[n]) {
                    callDeleteHandler({tt: n, i: itemsCount[n] - 1});
                    itemsCount[n]--;
                }
            }
        }

        function callTitleChangeHandler(title) {
            if (titleChangeHandler) {
                JET.debug("Calling JET.News title change handler. title:", title);
                titleChangeHandler(title);
            }
        }

        function callQueryResolvedHandler(resolution) {
            if (queryResolvedHandler) {
                JET.debug("Calling JET.News title change handler. resolution:", JSON.stringify(resolution));
                queryResolvedHandler(resolution);
            }
        }

        function sendRequestForOtherHeadlines(ReqId, NumberOfHeadlines) {
            //Send the AppHits Usage Tracking
            var action = "More";
            var dataSource = getDataSourceName(newsParams.ds);
            if (ReqId == "gn")
                action = "Newer";

            sendAppHit(dataSource + action + "_", "_" + NumberOfHeadlines.toString());

            maxCounts[1] += NumberOfHeadlines;
            JET.publish("/News/ControlChannel", JSON.stringify({
                a: ReqId,
                c: newsParams["c"],
                nb: NumberOfHeadlines ? NumberOfHeadlines : -1
            }));
        }

        function sendSimpleRequest(ReqId) {
            JET.publish("/News/ControlChannel", JSON.stringify({a: ReqId, c: newsParams["c"]}));
        }

        function getDataSourceName(ds) {
            var name = "";
            if (!ds) {
                name = "NewsWire";
            }
            else {
                if (ds == 0)
                    name = "NewsWire";
                else
                    name = "NewsRoom";
            }
            return name;
        }

        function handleCommand(command) {
            if (typeof(command.i) !== "undefined") {
                command.i--;
            }

            switch (command.a) {
                case "a":
                    if (applyWorkarounds) {
                        command.i = 0;
                    } else {
                        command.i = itemsCount[command.tt];
                    }

                    callInsertOrUpdate(command);
                    itemsCount[command.tt]++;

                    if (applyWorkarounds) {
                        deleteExcessHeadlines(maxCounts);
                    }
                    break;
                case "i":
                    callInsertOrUpdate(command);
                    itemsCount[command.tt]++;

                    if (applyWorkarounds) {
                        deleteExcessHeadlines(maxCounts);
                    }
                    break;
                case "d":
                    callDeleteHandler(command);
                    itemsCount[command.tt]--;
                    break;
                case "p":
                    command.i = itemsCount[command.tt] - 1;
                    callDeleteHandler(command);
                    itemsCount[command.tt]--;
                    break;
                case "c":
                    if (typeof(command.tt) == "undefined") {
                        command.tt = null;
                    }
                    var limit = [maxCounts[0], maxCounts[1]];
                    if (command.tt != null) {
                        limit[command.tt] = 0;
                    } else {
                        limit = [0, 0];
                    }

                    if (clearHandler) {
                        if (command.tt != null) {
                            itemsCount[command.tt] = 0;
                            callClearHandler(command);
                        } else {
                            itemsCount = [0, 0];
                            callClearHandler({a: "c", tt: 0});
                            callClearHandler({a: "c", tt: 1});
                        }
                    } else {
                        deleteExcessHeadlines(limit);
                    }
                    break;
                case "b":
                    if (!command.c) {
                        break;
                    }
                    for (var i = 0; i < command.c.length; i++) {
                        handleCommand(command.c[i]);
                    }
                    break;
                case "s":
                    if (showNewsServiceStatusHandler) {
                        JET.debug("Calling JET.News onNewsServiceStatus handler", command);
                        showNewsServiceStatusHandler(command);
                    }
                    break;
                case "st":
                    if (showSubscriptionStatusHandler) {
                        JET.debug("Calling JET.News onSubscriptionStatus handler", command);
                        showSubscriptionStatusHandler(command);
                    }
                    break;
                case "hr":
                    if (historicalNewsReceivedHandler) {
                        JET.debug("Calling JET.News onhistoricalNewsReceived handler");
                        historicalNewsReceivedHandler();
                    }
                    break;
                case "e":
                    if (!settings.nativeMultiQueries) {
                        JET.debug("JET.News onTitleChange/onQueryResolved handler silenced in favor of manual AOD.", command);

                        return;
                    }

                    makeTokensForwardCompatible(command.s);

                    // multiquery
                    if (typeof newsParams.e == 'object') {
                        var title = {};
                        Object.keys(newsParams.e).map(function(key) {
                            if (command.s[key]) {
                                title[key] = command.s[key].map(function (token) {
                                    return token.label;
                                }).join(' ');
                            }
                        });
                        callTitleChangeHandler(title);
                    }
                    // simple query
                    else {
                        callTitleChangeHandler(command);
                    }

                    callQueryResolvedHandler(command.s);

                    break;
            }
        }

        var defaultNewsHandler = function (eventObj) {
            if ((!eventObj)) {
                return;
            }

            handleCommand(parseJSON(eventObj));
        };

        //public interface object
        var subscription = {
            /**
             * Sets the html template object
             * @function template
             * @memberof JET.News.Subscription
             * @param {JET.News.Template} template - Template object
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * // Create and configure a headline template
             * var template = JET.News.newTemplate()
             *   .highlightedHeadline("&lt;span style='background-color: dodgerblue'&gt;%s&lt;/span&gt;")
             *   .highlightedKeyword("&lt;span style='background-color: orangered'&gt;%s&lt;/span&gt;");
             *
             * // Create a subscription
             * var subscription = JET.News.create()
             *   .newsExpression("A")
             *   .template(template)    // Set the template
             *   .highlightExpression("LEN")    // highlight news in English
             *   .highlightKeywords("bank;annual;china;price;asia")    // highlight "bank", "annual", "china", "price" and "asia" keywords
             *   .highlightKeywordType(2)
             *   .onAppend(onAppend)
             *   .onInsert(onInsert)
             *   .onDelete(onDelete)
             *   .start();
             */
            template: function (templateObject) {
                checkParameter(templateObject, "templateObject", "object");
                newsParams.t = templateObject.getRawTemplate();
                return this;
            },
            /**
             * Sets the size of the 'top' section of news headlines
             * @function topSize
             * @memberof JET.News.Subscription
             * @param {number} size - Number of rows in the top container
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * JET.News.create()
             *   .newsExpression("A")
             *   .topSize(2)
             *   .onAppend(onAppend)
             *   .onInsert(onInsert)
             *   .onDelete(onDelete)
             *   .start();
             */
            topSize: function (size) {
                checkParameter(size, "size", "number");
                newsParams.top = size;
                return this;
            },
            /**
             * Sets the size of the ‘basket’ section of news headlines
             * @function basketSize
             * @memberof JET.News.Subscription
             * @param {number} size  - Number of rows in the basket container
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * JET.News.create()
             *   .newsExpression("A")
             *   .basketSize(20)
             *   .onAppend(onAppend)
             *   .onInsert(onInsert)
             *   .onDelete(onDelete)
             *   .start();
             */
            basketSize: function (size) {
                checkParameter(size, "size", "number");
                newsParams.b = size;
                return this;
            },
            /**
             * @callback JET.News.Subscription~Callback
             * @param {JET.News.Subscription~NewsObject} newsObject - An object contains all information of News headline
             */

            /**
             * @callback JET.News.Subscription~TitleCallback
             * @param {Object} titleObject - An object that contains a query title
             */

            /**
             * @callback JET.News.Subscription~QueryResolvedCallback
             * @param {Object} queryTokensObject - An object that contains a query tokens
             */

            /**
             * Sets expression for selecting news headlines that will be received from container (for example: 'LEN' - all news on English)
             * @function newsExpression
             * @memberof JET.News.Subscription
             * @param {string|Object} expression - News expression
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * JET.News.create()
             *   .newsExpression("A")
             *   .onAppend(onAppend)
             *   .onInsert(onInsert)
             *   .onDelete(onDelete)
             *   .start();
             *
             * function onAppend(command) {
             * };
             *
             * function onInsert(command) {
             * };
             *
             * function onDelete(command) {
             * };
             *
             * @example
             * JET.News.create()
             *   .newsExpression({
             *      main: 'MSFT.O AND INTC.O',
             *      lang: 'LEN OR LFR'
             *   })
             *   .onAppend(onAppend)
             *   .onInsert(onInsert)
             *   .onDelete(onDelete)
             *   .start();
             *
             * function onAppend(command) {
             * };
             *
             * function onInsert(command) {
             * };
             *
             * function onDelete(command) {
             * };
             */
            newsExpression: function (newsExpression) {
                newsParams.e = newsExpression;

                return this;
            },
            /**
             * Set Headline Highlight Expression
             * @function highlightExpression
             * @memberof JET.News.Subscription
             * @param {string} expression - Highlight expression string
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * subscription.highlightExpression("LEN");    // highlight news in English
             */
            highlightExpression: function (expressionString) {
                checkParameter(expressionString, "expressionString", "string");
                newsParams.hh = expressionString;
                return this;
            },
            /**
             * Set type of keywords for highlight
             * @function highlightKeywordType
             * @memberof JET.News.Subscription
             * @param {number} highlightKeywordType - Highlight keyword type (0: Highlight nothing, 1: Highlight text found in the highlightExpression, 2: Highlight text that match highlightKeywords, 3: Highlight text found in the highlightExpression & Highlight text that match highlightKeywords)
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * subscription.highlightKeywordType(2);
             */
            highlightKeywordType: function (highlightKeywordType) {
                checkParameter(highlightKeywordType, "highlightKeywordType", "number");
                newsParams.hk = highlightKeywordType;
                return this;
            },
            /**
             * Set highlight keywords. Keywords can be separated by “;” character
             * @function highlightKeywords
             * @memberof JET.News.Subscription
             * @param {string} keywords - Keywords to highlight
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * subscription.highlightKeywords("bank;annual;china;price;asia");    // highlight "bank", "annual", "china", "price" and "asia" keywords
             */
            highlightKeywords: function (HighlightKeywordsString) {
                checkParameter(HighlightKeywordsString, "HighlightKeywordsString", "string");
                newsParams.hkl = HighlightKeywordsString;
                return this;
            },

            /**
             * Sets string's template for date. Default value is "dd-MMM-yyyy"
             * @function dateTemmplate
             * @memberof JET.News.Subscription
             * @param {string} template - Date template string
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * // Following placeholders can be used in date template.
             * // d    - Date with no leading zero for single-digit date
             * // dd   - Date with leading zero for single-digit date
             * // ddd  - Abbreviated day of week name e.g. Wed
             * // dddd - Day of week name e.g. Wednesday
             * // M    - Month with no leading zero for single-digit month
             * // MM   - Month with leading zero for single-digit month
             * // MMM  - Abbreviated month name e.g. Apr
             * // MMMM - Month name e.g. April
             * // yy   - Two digits year e.g. 14 for 2014
             * // yyyy - Four digits year e.g. 2014
             *
             * JET.News.create()
             *   .newsExpression("A")
             *   .dateTemplate("dddd @ dd @ MMMM @ yyyy")
             *   .onAppend(onAppend)
             *   .onInsert(onInsert)
             *   .onDelete(onDelete)
             *   .start();
             */
            //Sets string's template for date, like "dd-MMM-yyyy" (default value). More variants:
            //http://www.geekzilla.co.uk/View00FF7904-B510-468C-A2C8-F859AA20581F.htm
            dateTemplate: function (templateString) {
                checkParameter(templateString, "templateString", "string");
                newsParams.dt = templateString;
                return this;
            },

            /**
             * Sets string's template for time. Default value is "hh:mm:ss"
             * @function timeTemplate
             * @memberof JET.News.Subscription
             * @param {string} template - Time template string
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * // Following placeholders can be used in time template.
             * // h   - Hours with no leading zero for single-digit hours; 12-hour clock
             * // hh  - Hours with leading zero for single-digit hours; 12-hour clock
             * // H   - Hours with no leading zero for single-digit hours; 24-hour clock
             * // HH  - Hours with leading zero for single-digit hours; 24-hour clock
             * // m   - Minutes with no leading zero for single-digit minutes
             * // mm  - Minutes with leading zero for single-digit minutes
             * // s   - Seconds with no leading zero for single-digit seconds
             * // ss  - Seconds with leading zero for single-digit seconds
             * // t   - One character time marker string, such as A or P
             * // tt  - Multicharacter time marker string, such as AM or PM
             * // fff - Milliseconds
             *
             * JET.News.create()
             *   .newsExpression("A")
             *   .timeTemplate("h^m^s tt")
             *   .onAppend(onAppend)
             *   .onInsert(onInsert)
             *   .onDelete(onDelete)
             *   .start();
             */
            //Sets string's template for time, like "hh:mm:ss" (default value). More variants:
            //http://www.geekzilla.co.uk/View00FF7904-B510-468C-A2C8-F859AA20581F.htm
            timeTemplate: function (templateString) {
                checkParameter(templateString, "templateString", "string");
                newsParams.tt = templateString;
                return this;
            },

            //Sets the flag for including Broker Research Headline
            setBrokerResearchHeadline: function () {
                newsParams.r = 1;
                return this;
            },

            //Clears the flag for including Broker Research Headline
            clearBrokerResearchHeadline: function () {
                newsParams.r = 0;
                return this;
            },

            //Sets the flag for including Broker Research Headline
            setNewsroomSource: function () {
                newsParams.ds = 1;
                return this;
            },

            //Sets function that will receive original event string from the Container.
            //From this string all needed information can be obtained for further processing
            //In case if this handler is set, handlers for particular commands, like "append", "insert" cannot be set
            setNewsHandler: function (handler) {
                if (!isIndividualHandlersSet) {
                    checkParameter(handler, "handler", "function");
                    newsHandler = handler;
                    isCommonHandlerSet = true;
                    return this;
                }
                else {
                    throw new Error("Common handler cannot be set, after any of individual handlers for commands had been set");
                }
            },

            //Initialize the Highlighting context
            setHighlighter: function (Pattern, HighlightObject) {
                checkParameter(Pattern, "Pattern", "string");
                checkParameter(HighlightObject, "HighlightObject", "object");
                newsParams.p = Pattern;
                newsParams.h = HighlightObject;
                return this;
            },

            dateRange: function (fromDate, toDate) {
                if (newsParams.e) {
                    if ((typeof newsParams.e == 'string' && newsParams.e.toLowerCase().indexOf("daterange:") >= 0) ||
                        newsParams.e.dateRange) {
                        throw new Error("DateRange has already been defined in news expression!");
                    }
                }
                if (!fromDate && !toDate) dateRangeExpression = "";
                else {
                    if (fromDate) checkParameter(fromDate, "fromDate", "string");
                    if (toDate) checkParameter(toDate, "toDate", "string");
                    // prepare dateRange part of expression
                    dateRangeExpression = 'DateRange:"' + (fromDate || "") + "," + (toDate || "") + '"';
                }
                return this;
            },
            /**
             * Use for register a callback function to be called when a headline needs to be added at the bottom of the specified container
             * @function onAppend
             * @memberof JET.News.Subscription
             * @param {JET.News.Subscription~Callback} handler - A callback function to be called when a headline needs to be added at the bottom of the specified container
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * JET.News.create()
             *   .newsExpression("A")
             *   .onAppend(onAppend)
             *   .onInsert(onInsert)
             *   .onDelete(onDelete)
             *   .start();
             *
             * function onAppend (command) {
             *   // Add a new headline to bottom of the container
             * }
             */
            onAppend: function (handler) {
                if (!isCommonHandlerSet) {
                    checkParameter(handler, "handler", "function");
                    appendHandler = handler;
                    isIndividualHandlersSet = true;
                    return this;
                }
                else {
                    throw new Error("Handler for 'Append' command, can not be set after common handler had been set");
                }
            },
            /**
             * Use for register a callback function to be called when a headline needs to be inserted into the specified container at the specified position
             * @function onInsert
             * @memberof JET.News.Subscription
             * @param {JET.News.Subscription~Callback} handler - A callback function to be called when a headline needs to be inserted into the specified container at the specified position
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * JET.News.create()
             *   .newsExpression("A")
             *   .onAppend(onAppend)
             *   .onInsert(onInsert)
             *   .onDelete(onDelete)
             *   .start();
             *
             * function onInsert (command) {
             *   // Insert a new headline to the specified position.
             * }
             */
            onInsert: function (handler) {
                if (!isCommonHandlerSet) {
                    checkParameter(handler, "handler", "function");
                    insertHandler = handler;
                    isIndividualHandlersSet = true;
                    return this;
                }
                else {
                    throw new Error("Handler for 'Insert' command, can not be set after common handler had been set");
                }
            },
            /**
             * Use for register a callback function to be called when a headline needs to be removed from the specified container at the specified position
             * @function onDelete
             * @memberof JET.News.Subscription
             * @param {JET.News.Subscription~Callback} handler - A callback function to be called when a headline needs to be removed from the specified container at the specified position
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * JET.News.create()
             *   .newsExpression("A")
             *   .onAppend(onAppend)
             *   .onInsert(onInsert)
             *   .onDelete(onDelete)
             *   .start();
             *
             * function onDelete (command) {
             *   // Delate a new headline at the specified position.
             * }
             */
            onDelete: function (handler) {
                if (!isCommonHandlerSet) {
                    checkParameter(handler, "handler", "function");
                    deleteHandler = handler;
                    isIndividualHandlersSet = true;
                    return this;
                }
                else {
                    throw new Error("Handler for 'Delete' command, can not be set after common handler had been set");
                }
            },
            /**
             * Use for register a callback function to be called when a title as been generated for the query
             * @function onTitleChange
             * @memberof JET.News.Subscription
             * @param {JET.News.Subscription~TitleCallback} handler - A callback function to be called when a title as been generated for the query
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * JET.News.create()
             *   .newsExpression("A")
             *   .onTitleChange(onTitleChange)
             *   .start();
             *
             * function onTitleChange (command) {
             *   // use the generated title for the query
             * }
             */
            onTitleChange: function (handler) {
                if (!isCommonHandlerSet) {
                    checkParameter(handler, "handler", "function");
                    titleChangeHandler = handler;
                    return this;
                }
                else {
                    throw new Error("Handler for 'onTitleChange' command, can not be set after common handler had been set");
                }
            },
            /**
             * Use for register a callback function to be called when query was resolved
             * @function onQueryResolved
             * @memberof JET.News.Subscription
             * @param {JET.News.Subscription~Callback} handler - A callback function to be called when query was resolved
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * JET.News.create()
             *   .newsExpression("TRI.N")
             *   .onAppend(onAppend)
             *   .onInsert(onInsert)
             *   .onDelete(onDelete)
             *   .onQueryResolved(onQueryResolved)
             *   .start();
             *
             * function onQueryResolved (command) {
             *   // Query was resolved
             * }
             */  
            onQueryResolved: function (handler) {
                if (!isCommonHandlerSet) {
                    checkParameter(handler, "handler", "function");
                    queryResolvedHandler = handler;
                    return this;
                }
                else {
                    throw new Error("Handler for 'onQueryResolved' command, can not be set after common handler had been set");
                }
            },
            /**
             * Use for register a callback function to be called when current news items are needed to be cleared
             * @function onClear
             * @memberof JET.News.Subscription
             * @param {JET.News.Subscription~Callback} handler - A callback function to be called when current news items are needed to be cleared
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * JET.News.create()
             *   .newsExpression("TRI.N")
             *   .onAppend(onAppend)
             *   .onInsert(onInsert)
             *   .onDelete(onDelete)
             *   .onClear(onClear)
             *   .start();
             *
             * function onClear (command) {
             *   // Clear current news items
             * }
             */  
            onClear: function (handler) {
                if (!isCommonHandlerSet) {
                    checkParameter(handler, "handler", "function");
                    clearHandler = handler;
                    isIndividualHandlersSet = true;
                    return this;
                }
                else {
                    throw new Error("Handler for 'Clear' command, can not be set after common handler had been set");
                }
            },
            /**
             * Use for register a callback function to be called when historical headlines fetching is finished
             * @function onHistoricalNewsReceived
             * @memberof JET.News.Subscription
             * @param {JET.News.Subscription~Callback} handler - A callback function to be called when historical headlines fetching is finished
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * JET.News.create()
             *   .newsExpression("TRI.N")
             *   .onAppend(onAppend)
             *   .onInsert(onInsert)
             *   .onDelete(onDelete)
             *   .onHistoricalNewsReceived(onHistoricalNewsReceived)
             *   .start();
             *
             * function onHistoricalNewsReceived (command) {
             *   // All historical headlines are received
             * }
             */
            onHistoricalNewsReceived: function (handler) {
                checkParameter(handler, "handler", "function");
                historicalNewsReceivedHandler = handler;
                return this;
            },
            /**
             * Use for register a callback function to be called when News service status is changed
             * @function onNewsServiceStatus
             * @memberof JET.News.Subscription
             * @param {JET.News.Subscription~Callback} handler - A callback function to be called when News service status is changed. The status value can be read in the “s” field of the event object.
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * JET.News.create()
             *   .newsExpression("TRI.N")
             *   .onAppend(onAppend)
             *   .onInsert(onInsert)
             *   .onDelete(onDelete)
             *   .onNewsServiceStatus(onNewsServiceStatus)
             *   .start();
             *
             * function onNewsServiceStatus (command) {
             *   var statusNames = {1: "UP", 2: "STALE", 3: "DOWN"};
             *   var status = statusNames[command.s]);
             * }
             */
            onNewsServiceStatus: function (handler) {
                if (!isCommonHandlerSet) {
                    checkParameter(handler, "handler", "function");
                    showNewsServiceStatusHandler = handler;
                    isIndividualHandlersSet = true;
                    return this;
                }
                else {
                    throw new Error("Handler for 'ShowNewsServiceStatus' command, can not be set after common handler had been set");
                }
            },

            //Sets handler for 'Status' command. By this command container tells about status of subscription.
            //Can not be used together with SetNewsHandler method.
            onSubscriptionStatus: function (handler) {
                if (!isCommonHandlerSet) {
                    checkParameter(handler, "handler", "function");
                    showSubscriptionStatusHandler = handler;
                    isIndividualHandlersSet = true;
                    return this;
                }
                else {
                    throw new Error("Handler for 'ShowSubscriptionStatus' command, can not be set after common handler had been set");
                }
            },
            /**
             * Start a subscription
             * @function start
             * @memberof JET.News.Subscription
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * subscription.start();
             */
            // - Creates a channel by sending special message to container with subscription params
            // - Subscribes on created channel either method that was set by SetNewsHandler method or internel handler, that will call  handlers were set by 
            //   onAppend, onInsert etc..
            // - Stores descriptor of subscription and channel id
            // This method shouldn't be called multiple times, throws an exception if called for already started subscription. Restart method should be used for re-subscribing 
            start: function () {
                if (!loaded) {
                    var _this = this;
                    loadedHandlers.push(function () { _this.start(); });
                    return this;
                }

                if (!isSubscribed) {
                    if (!newsParams.e) {
                        throw "A news expression should be specified to start a subscription"
                    }

                    // // some older versions need to wait for being active
                    // var c = JET.ContainerDescription;
                    // if (c.major < 8 ? 0 : (c.minor == 0 && c.build < 55 ? 0 : 1)) {
                    //     if (!JET.isActive()) {
                    //         isStartPaused = true;
                    //         return this;
                    //     }
                    // }

                    // save original expression from the parameters (before daterange and multi query modification)
                    var e = newsParams.e;

                    // should do a manual AOD
                    if (!settings.nativeMultiQueries) {
                        // multi query
                        if (typeof newsParams.e == 'object') {
                            var queries = newsParams.e;

                            // create a single subscription
                            newsParams.e = Object.keys(queries)
                                .filter(function(key) {
                                    return !!queries[key];
                                })
                                .map(function (key) {
                                    return '( ' + queries[key] + ' )';
                                }).join(' AND ');

                            // manually trigger title update
                            resolve(queries, function (command) {
                                var title = {};
                                var resolutions = {};

                                Object.keys(queries).map(function (key) {
                                    title[key] = command.expressionTokens[key].map(function (token) {
                                        return token.label;
                                    }).join(' ');
                                    resolutions[key] = command.expressionTokens[key];
                                });

                                callTitleChangeHandler(title);
                                callQueryResolvedHandler(resolutions);
                            });
                        }
                        // simple query
                        else {
                            resolve(newsParams.e, function (command) {

                                callTitleChangeHandler({m: command.expressionDescription});

                                callQueryResolvedHandler(command.expressionTokens);

                            });
                        }
                    }

                    //Send the AppHits Usage Tracking
                    sendAppHit(getDataSourceName(newsParams.ds) + "Sub_", "_" + newsParams.b.toString());

                    newsParams.c = "/News/" + id + "-" + restartID;
                    restartID++;
                    if (newsHandler) {
                        subscriptionHandle = JET.subscribe(newsParams.c, function (eventObj) {
                            newsHandler(parseJSON(eventObj));
                        });
                    }
                    else {
                        subscriptionHandle = JET.subscribe(newsParams.c, defaultNewsHandler);
                    }

                    maxCounts = {0: newsParams.top, 1: newsParams.b};

                    if (dateRangeExpression) {
                        // append daterange to the expression string
                        if (typeof newsParams.e == 'string') {
                            newsParams.e += ' AND ' + dateRangeExpression;
                        }
                        else {
                            newsParams.e.dateRange = dateRangeExpression;
                        }
                    }
                    // subscribe to the news channel
                    JET.publish("/News/ControlChannel", JSON.stringify(newsParams));

                    // restore saved expression (after daterange and multi query modification)
                    newsParams.e = e;

                    isSubscribed = true;
                    isStartPaused = false;

                    JET.information("JET.News subscription started");
                }
                return this;
            },

            restart: function () {
                this.stop();
                this.start();

                //return this;
            },
            /**
             * Stop a subscription
             * @function stop
             * @memberof JET.News.Subscription
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * subscription.stop();
             */
            stop: function () {
                if (isSubscribed) {
                    JET.publish("/News/ControlChannel", JSON.stringify({a: "unsub", c: newsParams["c"]}));
                    subscriptionHandle.unsubscribe();
                    isSubscribed = false;
                    isStartPaused = false;
                    JET.information("JET.News subscription stopped");
                }
                return this;
            },
            /**
             * Pause a subscription
             * @function pause
             * @memberof JET.News.Subscription
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * subscription.pause();
             */
            pause: function () {
                if (isSubscribed) {
                    sendSimpleRequest("p");
                }
                return this;
            },

            //Freeze current subscription.
            freeze: function () {
                if (isSubscribed) {
                    sendSimpleRequest("f");
                }
                return this;
            },
            /**
             * Resume a subscription
             * @function resume
             * @memberof JET.News.Subscription
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * subscription.resume();
             */
            resume: function () {
                if (isStartPaused) this.start();
                else if (isSubscribed) {
                    sendSimpleRequest("r");
                }
                return this;
            },
            /**
             * Retrieve additional headlines to the basket
             * @function more
             * @memberof JET.News.Subscription
             * @param {number} numberOfHeadlines - Number of additional headlines that you want to request
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * subscription.more(5);
             */
            more: function (NumberOfHeadlines) {
                sendRequestForOtherHeadlines("go", NumberOfHeadlines);
                return this;
            },

            //Ask Container for more newer headlines. Number of requested headlines is specified in 'NumberOfHeadlines' parameter
            newer: function (NumberOfHeadlines) {
                sendRequestForOtherHeadlines("gn", NumberOfHeadlines);
                return this;
            },

            //Ask Container to update the Highlighting context
            updateHighlighter: function (Pattern, HighlightObject) {
                checkParameter(Pattern, "Pattern", "string");
                checkParameter(HighlightObject, "HighlightObject", "object");

                JET.publish("/News/ControlChannel", JSON.stringify({
                    a: "h",
                    p: Pattern,
                    h: HighlightObject,
                    c: newsParams.c
                }));
            }

        };

        if (JET.onActivate && JET.onDeactivate) {
            JET.onActivate(function () {
                subscription.resume();
            });
            JET.onDeactivate(function () {
                subscription.pause();
            });
        }

        JET.onUnload(function () {
            subscription.stop();
        });

        subscriptions[id] = subscription;

        JET.information("JET.News subscription created");
        return subscription;
    }

    //Returns new object that represents template for highlighter. Object is initialized with default values.	
    function newHighlightObject(Expression, ClassName) {
        var newObject = {
            e: '',
            c: ''
        };
        newObject.e = Expression;
        newObject.c = ClassName;
        return newObject;
    }

    //Returns new object that represents template for headline. Object is initialized with default values.
    function newTemplate() {
        var realTemplateObject = {
            r: '<span class="newsric" jet="JETDATA" e.RIC="%s">%s</span>',
            st: '<a href="cpurl://views.cp./Explorer/NEWSxSTORY.aspx?ric=%s" class="newsSearch">%s</a>',
            se: '<a href="%s" class="newsStory">%s</a> ',
            l: '<a href="%s" class="newsLink">%s</a> ',
            hk: '<b>%s</b>',
            hh: '<span style="background-color:red">%s</span>'
        };

        var templateObject = {
            //Sets template for a RIC
            ric: function (templateString) {
                checkParameter(templateString, "templateString", "string");
                realTemplateObject.r = templateString;
                return this;
            },
            //Sets template for News story link
            newsStoryLink: function (templateString) {
                checkParameter(templateString, "templateString", "string");
                realTemplateObject.st = templateString;
                return this;
            },
            //Sets template for News search link
            newsSearchLink: function (templateString) {
                checkParameter(templateString, "templateString", "string");
                realTemplateObject.se = templateString;
                return this;
            },
            //Sets template for link
            link: function (templateString) {
                checkParameter(templateString, "templateString", "string");
                realTemplateObject.l = templateString;
                return this;
            },
            //Sets template for highlighted headline
            highlightedHeadline: function (templateString) {
                checkParameter(templateString, "templateString", "string");
                realTemplateObject.hh = templateString;
                return this;
            },
            //Sets template for highlighted keyword
            highlightedKeyword: function (templateString) {
                checkParameter(templateString, "templateString", "string");
                realTemplateObject.hk = templateString;
                return this;
            },
            //Returns template object that can be passed to Container
            getRawTemplate: function () {
                return realTemplateObject;
            }
        }
        return templateObject;
    }

    var highlightKeyWordTypes = {
        none: 0,
        byDefault: 1,
        keyword_list: 2,
        all: 3
    };

    //Creates a blank top news subscription
    //  subscriptionID is an optional parameter. ID will be generated if omitted.
    // Subscription object support methods chaining:
    //   JET.createTopNews() 
    //	    .ids("id1", "id2")
    //      .onUpdate(function(id, ver) { ... }) 
    //      .start()
    function createTopNews(subID) {
        var id = subID ? subID : baseSubID + (lastSubID++);
        var request = {
            a: "sub_top",
            c: "/News/" + id,
            ids: []
        };

        var subscriptionHandle = null;
        var updateHandler = null;
        var statusHandler = null;
        var isSubscribed = false;
        var pausedBuffer = null;
        var isStartPaused = false;

        var topNewsSubscription = {
            // ids : function(Array | Multiple String arguments)
            // Set an Array of Top Story IDs to the subscription,
            // or a list of Top Story IDs Strings
            // returns the modified TopNews subscription
            // Example:
            // s.addIDs(["ID1", "ID2", ...]);
            // or
            // s.addIDs("ID1", "ID2", ...);
            ids: function () {
                request.ids = parseArgumentsList(arguments).list;
                return this;
            },

            // Registers a handler to be called upon receiving Top News Story updates.
            // The handler is given 2 parameters :
            // storyID : String, The News Top Story ID
            // version : Integer, The Top Story Version
            // returns the modified TopNews subscription
            // Example:
            // var updateHandler = function(storyID, version) {
            //    console.log("The Top Story #"+storyID+
            //                " has been updated to version : "+version);
            // }
            // s.onUpdate(updateHandler);		
            onUpdate: function (handler) {
                checkParameter(handler, "handler", "function");
                updateHandler = handler;
                return this;
            },

            onStatus: function (handler) {
                checkParameter(handler, "handler", "function");
                statusHandler = handler;
                return this;
            },

            // Send the subscription to start getting updates about the list of subscribed Top Story IDs
            // Example:
            // s.start();
            start: function () {
                if (!JET.Loaded) {
                    var _this = this;
                    JET.onLoad(function() { _this.start(); });
                    return this;
                }

                if (!isSubscribed) {
                    if (request.ids.length == 0) {
                        throw "At least one id should be specified";
                    }

                    // var c = JET.ContainerDescription;
                    // if (c.major < 8 ? 0 : (c.minor == 0 && c.build < 55 ? 0 : 1)) {
                    //     if (!JET.isActive()) {
                    //         isStartPaused = true;
                    //         return this;
                    //     }
                    // }

                    var sub = this;

                    var mainHandler = function (event) {
                        var data = parseJSON(event);

                        if (data.a == "topnews" && updateHandler) {

                            if (pausedBuffer)
                                pausedBuffer[data.id] = {"ver": data.ver, "time": (new Date().getTime())};
                            else updateHandler(data.id, data.ver);
                        }

                        if (data.a == "s" && statusHandler) {
                            statusHandler(data.s);
                        }

                    };

                    //Send the AppHits Usage Tracking 
                    sendAppHit("TopNewsSub_", "");

                    subscriptionHandle = JET.subscribe(request.c, mainHandler);
                    JET.publish("/News/ControlChannel", JSON.stringify(request));
                    isSubscribed = true;
                    pausedBuffer = null;
                    isStartPaused = false;

                    JET.onUnload(function () {
                        topNewsSubscription.stop();
                    });
                }

                return this;
            },

            // Stops the subscription 
            // Example:
            // s.stop();
            stop: function () {
                if (isSubscribed) {
                    JET.publish("/News/ControlChannel", JSON.stringify({"a": "unsub_top", "c": request.c}));
                    subscriptionHandle.unsubscribe();
                    pausedBuffer = null;
                    isSubscribed = false;
                    isStartPaused = false;
                }
                return this;
            },

            // Pause the subscription
            // Example:
            // s.pause();
            pause: function () {
                if (isSubscribed && !pausedBuffer)
                    pausedBuffer = {};
                return this;
            },

            // Resume sending updates
            // Example:
            // s.resume();
            resume: function () {
                if (isStartPaused) this.start();
                else if (isSubscribed && pausedBuffer) {
                    for (var key in pausedBuffer)
                        updateHandler(key, pausedBuffer[key].ver, pausedBuffer[key].time);
                    pausedBuffer = null;
                }
                return this;
            }
        };

        if (JET.onActivate && JET.onDeactivate) {
            JET.onActivate(function () {
                topNewsSubscription.resume();
            });
            JET.onDeactivate(function () {
                topNewsSubscription.pause();
            });
        }

        return topNewsSubscription;
    }

    //Creates a blank top news subscription
    //  subscriptionID is an optional parameter. ID will be generated if omitted.
    // Subscription object support methods chaining:
    //   JET.createNewsUpdate() 
    //	    .ids("id1", "id2")
    //      .onUpdate(function(id, ver, extend) { ... }) 
    //      .start()
    function createNewsUpdate(subID) {
        var id = subID ? subID : baseSubID + (lastSubID++);
        var request = {
            a: "sub_upd",
            c: "/News/" + id,
            ids: []
        };

        var subscriptionHandle = null;
        var updateHandler = null;
        var statusHandler = null;
        var isSubscribed = false;
        var pausedBuffer = null;
        var isStartPaused = false;
        /**
         * An object contains all information of News headline
         * @typedef JET.News.Subscription~NewsObject
         * @property {number} i - Zero-based index of the position of the headline to delete or insert
         * @property {number} tt - Index of the container to modify. (0: Top, 1: Basket)
         * @property {string} urn - News Headline URN
         * @property {string} d - Date formatted using the date format received in the subscribe verb
         * @property {string} t - Time formatted using the date format received in the subscribe verb
         * @property {string} h - HTML-formatted headline
         * @property {number} ct - Content type. (0: none, 1: video, 2: pdf)
         * @property {string} sn - News source e.g. Reuters News
         * @property {string} src - Abbreviations of news source e.g. RTRS
         * @property {number} ht - Headline type. (1:Take, 2:Alert)
         * @property {string} S - Story extract
         * @property {number} ltr - Left-to-right language flag. (0: right-to-left, 1: left-to-right)
         * @property {string} tl - List of related topic (RCS codes)
         * @property {string} rl - List of related company codes
         */

        /**
         * @callback JET.News.Subscription~Callback
         * @param {JET.News.Subscription~NewsObject} newsObject - An object contains all information of News headline
         */

        /**
         * @callback JET.News.Subscription~TitleCallback
         * @param {Object} titleObject - An object that contains a query title
         */

        /**
         * @callback JET.News.Subscription~QueryResolvedCallback
         * @param {Object} queryTokensObject - An object that contains a query tokens
         */
        var NewsUpdateSubscription = {
            // ids : function(Array | Multiple String arguments)
            // Set an Array of Story IDs or Report ID to the subscription,
            // or a list of Story IDs Strings
            // returns the modified News Update subscription
            // Example:
            // s.addIDs(["ID1", "ID2", ...]);
            // or
            // s.addIDs("ID1", "ID2", ...);
            ids: function () {
                request.ids = parseArgumentsList(arguments).list;
                return this;
            },

            // Registers a handler to be called upon receiving Top News Story updates.
            // The handler is given 2 parameters :
            // storyID : String, The News Story ID
            // version : Integer, The Story Version
            // returns the modified News Update subscription
            // Example:
            // var updateHandler = function(storyID, version, extend) {
            //    console.log("The Story #"+storyID+
            //                " has been updated to version : "+version);
            // }
            // s.onUpdate(updateHandler);		
            onUpdate: function (handler) {
                checkParameter(handler, "handler", "function");
                updateHandler = handler;
                return this;
            },

            onStatus: function (handler) {
                checkParameter(handler, "handler", "function");
                statusHandler = handler;
                return this;
            },

            /**
             * Start a subscription
             * @function start
             * @memberof JET.News.Subscription
             * @return {JET.News.Subscription} return A current subscription
             *
             * @example
             * subscription.start();
             */
            start: function () {
                if (!JET.Loaded) {
                    JET.onLoad(this.start);
                    return this;
                }

                if (!isSubscribed) {
                    if (request.ids.length == 0) {
                        throw "At least one id should be specified";
                    }

                    // var c = JET.ContainerDescription;
                    // if (c.major < 8 ? 0 : (c.minor == 0 && c.build < 55 ? 0 : 1)) {
                    //     if (!JET.isActive()) {
                    //         isStartPaused = true;
                    //         return this;
                    //     }
                    // }

                    var sub = this;

                    var mainHandler = function (event) {
                        var data = parseJSON(event);

                        if (data.a == "newsupd" && updateHandler) {

                            if (pausedBuffer)
                                pausedBuffer[data.id] = {"ver": data.ver, "time": (new Date().getTime())};
                            else updateHandler(data.id, data.ver, data.alert);
                        }

                        if (data.a == "s" && statusHandler) {
                            statusHandler(data.id, data.s, data.m);
                        }

                    };

                    //Send the AppHits Usage Tracking 
                    sendAppHit("StorySub_", "");

                    subscriptionHandle = JET.subscribe(request.c, mainHandler);
                    JET.publish("/News/ControlChannel", JSON.stringify(request));
                    isSubscribed = true;
                    pausedBuffer = null;
                    isStartPaused = false;

                    JET.onUnload(function () {
                        NewsUpdateSubscription.stop();
                    });
                }

                return this;
            },

            // Stops the subscription 
            // Example:
            // s.stop();
            stop: function () {
                if (isSubscribed) {
                    JET.publish("/News/ControlChannel", JSON.stringify({"a": "unsub_upd", "c": request.c}));
                    subscriptionHandle.unsubscribe();
                    pausedBuffer = null;
                    isSubscribed = false;
                    isStartPaused = false;
                }
                return this;
            },

            // Pause the subscription
            // Example:
            // s.pause();
            pause: function () {
                if (isSubscribed && !pausedBuffer)
                    pausedBuffer = {};
                return this;
            },

            // Resume sending updates
            // Example:
            // s.resume();
            resume: function () {
                if (isStartPaused) this.start();
                else if (isSubscribed && pausedBuffer) {
                    for (var key in pausedBuffer)
                        updateHandler(key, pausedBuffer[key].ver, pausedBuffer[key].time);
                    pausedBuffer = null;
                }
                return this;
            }
        };

        if (JET.onActivate && JET.onDeactivate) {
            JET.onActivate(function () {
                NewsUpdateSubscription.resume();
            });
            JET.onDeactivate(function () {
                NewsUpdateSubscription.pause();
            });
        }

        return NewsUpdateSubscription;
    }

    return {
            name:"News",
            api:{"News":{
                            
                /**
                * @private
                */
            	init: init,

                /**
                 * Instantiates a new News headlines subscription
                 * @function create
                 * @memberof JET.News
                 * @param {string} [subscriptionID] - ID of the subscription
                 * @return {JET.News.Subscription} return A new News headlines subscription
                 *
                 * @example
                 * JET.News.create()
                 *   .newsExpression("A")
                 *   .onAppend(onAppend)
                 *   .onInsert(onInsert)
                 *   .onDelete(onDelete)
                 *   .start();
                 *
                 * function onAppend(command) {
                 * };
                 *
                 * function onInsert(command) {
                 * };
                 *
                 * function onDelete(command) {
                 * };
                 */
                create: newSubscription,        
                
                /**
                 * Getting a subscription from a subscription ID.
                 * @function get
                 * @memberof JET.News
                 * @param {string} subscriptionID - ID of the subscription
                 * @return {JET.News.Subscription} return A subscription
                 *
                 * @example
                 * JET.News.create("myID");
                 * var mySubscription = JET.News.get("myID");
                 */
                get: function(id) {
                    return subscriptions[id];
                },
                
                /**
                 * @callback JET.News~ResolutionCallback
                 * @param {Object} queryTokensObject - An object that contains a query tokens
                 */

                /**
                 * Computes the tokens for a given query, passing them through a callback
                 * @function resolve
                 * @memberof JET.News
                 * @param {string|Object} query News expression to resolve
                 * @param {JET.News~ResolutionCallback} handler A handler to be called when the tokens resolution have been done
                 *
                 * @example
                 * JET.News.resolve("MSFT.O AND LEN", handler);
                 *
                 * function handler(resolution) {
                 *    // work with the tokens
                 * };
                 */
                resolve: resolve,
                
                /**
                 * Creates a new template object with default template values
                 * @function newTemplate
                 * @memberof JET.News
                 * @return {JET.News.Template} return A template
                 *
                 * @example
                 * var template = JET.News.newTemplate();
                 */
                newTemplate: newTemplate,
                
                //Return news template to define one highlighter object
                newHighlightObject: newHighlightObject,
                
                //Returns enumeration with types of words highlighting
                highlightKeyWordTypes: highlightKeyWordTypes,

                // Creates a new top news subscription
                createTopNews: createTopNews,
            
                // Creates a new news update subscription
                createNewsUpdate: createNewsUpdate,
                
                // Temporary fix for unit testing to toggle SR1 workarounds
                // Do not use in production code!
                /**
                * @private
                */
                setWorkaround: function(val) {
                    applyWorkarounds = val;
                }
            }
        }
    };
});

JET.News.init();
