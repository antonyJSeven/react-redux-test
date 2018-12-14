'use strict';

function configure(app) {
    app.post('/Logger', function (context, payload, req, res) {
        var logger = context.getLogger();
        var type = payload.type;
        var info = payload.info;
        logger[type](info);
        res.send(200, 'success');
    });
}

module.exports = configure;