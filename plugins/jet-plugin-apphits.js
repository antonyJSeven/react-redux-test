JET.AppHits = {};

JET.plugin(function(_u){
	return {
		name:"AppHits",

		api:{
		 /**
		 * Used for track the usage of your application
		 * @param {string} appName - The name of your application. It must be a string not exceeding 40 characters.
		 * @param {string} subProduct - Use "app" for web app, use "dsk" for desktop object. Please see https://thehub.thomsonreuters.com/docs/DOC-645075 for more information.
		 * @param {string} [feature] - The feature of your application that you are tracking. It must be a string not exceeding 40 characters
		 *
		 * @example
		 * JET.appHit("JET", "app", "SampleAppHit");
		 */
		  appHit:function(appName, subProduct, feature) {
                            var error = function(varname, varlen) {
                                throw new Error(varname + " should be a string not exceeding " + varlen + " chars");
                            };
                            feature = feature || "";
                            if (appName && appName.trim().length > 40) error("appName", 40);
                            if (subProduct && subProduct.trim().length > 40) error("subProduct", 40);
                            if (feature && feature.trim().length > 40) error("feature", 40);

                            JET.publish("/desktop/usagelog", JSON.stringify({
                                "AppHitsCode": appName.trim() + "@" + subProduct.trim(),
                                "Feature": feature.trim()
                            }));
               }
		}

	}

});