'use strict';

function configure(app) {
    app.get('/AppHitsFeatureHit', function (context, payload, req, res) {
        var featureName = getQueryParameter(context.request.url);
        if(context.logFeatureHit) {
            context.logFeatureHit(featureName);
        } else {
            context.logAppHit(featureName);
        }
        res.send(200, 'success');
    });

    function getQueryParameter(url) {
        return url.split('?')[1];
    }
}

module.exports = configure;
