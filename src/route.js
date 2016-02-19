'use strict';

module.exports = function(app, express) {
    var route = function(base) {
        var register = function(method, path, cb) {
            app[method]('/' + base + '/' + path, function(req, res) {
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
            get: function(path, cb) {
                register('get', path, cb);
            },
            post: function(path, cb) {
                register('post', path, cb);
            },
            put: function(path, cb) {
                register('put', path, cb);
            },
            delete: function(path, cb) {
                register('delete', path, cb);
            }
        };
    };

    return function(base, cb) {
        cb(route(base));
    };
};
