'use strict';

module.exports = function(path, app, express, config) {

    app.use('/fritz', express.static(path.join(config.paths.fritz, 'admin')));

    return {
        tables: {}
    };
};
