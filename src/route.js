'use strict';

module.exports = function(_, app, express, path) {
    var route = function(base) {
        var register = function(method, endpoint, cb) {
            if(_.isFunction(endpoint)) {
                cb = endpoint;
                endpoint = base;
            } else {
                endpoint = path.join(base, endpoint);
            }
            endpoint = path.join('/', endpoint);
            app[method](endpoint, function(req, res) {
                var content = cb(req, req.body, res);
                if(content instanceof Promise) {
                    content.then(function(result) {
                        res.json(result);
                    }).catch(function(err) {
                        res.json({
                            error: err.message
                        });
                    });
                } else {
                    res.json(content);
                }
            });
        };

        return {
            app: app,
            get: function(endpoint, cb) {
                register('get', endpoint, cb);
            },
            post: function(endpoint, cb) {
                register('post', endpoint, cb);
            },
            put: function(endpoint, cb) {
                register('put', endpoint, cb);
            },
            delete: function(endpoint, cb) {
                register('delete', endpoint, cb);
            }
        };
    };

    return function(base, cb) {
        cb(route(base));
    };
};
