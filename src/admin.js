'use strict';

module.exports = function(path, app, express, config, route) {

    var models = [];
    app.use('/fritz', express.static(path.join(config.paths.dirname, 'admin')));

    route('fritz', function(method) {
        method.get('models', function() {
            return 'hello world';
        });
    });

    return {
        register: function(descriptor, model) {
            descriptor.model = model;

            models.push(descriptor);
        }
    };
};
