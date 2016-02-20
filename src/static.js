'use strict';

module.exports = function(app, express, config, path) {
    return function(folder, route) {
        folder = path.join(config.paths.cwd, folder);
        var middleware = express.static(folder);
        if(route) {
            app.use(route, middleware);
        } else {
            app.use(middleware);
        }
    };
};
