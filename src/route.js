'use strict';

module.exports = function(
    _,
    app,
    express,
    path,
    run,
    apiError
) {
    let handler = apiError.handler;

    let route = function(base) {
        let beforeEach = [];
        let interceptors = [];
        let register = function(method, endpoint, cb) {
            let before = interceptors;
            interceptors = [];
            if(_.isFunction(endpoint)) {
                cb = endpoint;
                endpoint = base;
            } else {
                endpoint = path.join(base, endpoint);
            }
            if(run.isGenerator(cb)) {
                cb = run(cb);
            }
            endpoint = path.join('/', endpoint);
            app[method](endpoint, function(req, res) {
                let deferred = Promise.resolve();
                let intercept = cb => {
                    if(run.isGenerator(cb)) {
                        cb = run(cb);
                    }
                    deferred = deferred.then(() => cb.apply(app, arguments));
                };
                _.forEach(beforeEach, intercept);
                _.forEach(before, intercept);
                let content = cb.apply(app, arguments);
                run(function*() {
                    yield deferred;
                    if(content instanceof Promise) {
                        content = yield content;
                    }
                    res.json(content);
                })().catch(handler.apply(app, arguments));
            });
        };

        let methods = function(interceptor) {
            interceptors.push(interceptor);
        };

        methods.beforeEach = function(before) {
            if(_.isArray(before)) {
                beforeEach = beforeEach.concat(before);
            } else {
                beforeEach.push(before);
            }
        };

        methods.express = express;
        methods.app = app;
        _.forEach([
            'all',
            'checkout',
            'connect',
            'copy',
            'delete',
            'get',
            'head',
            'lock',
            'merge',
            'mkactivity',
            'mkcol',
            'move',
            'm-search',
            'notify',
            'options',
            'patch',
            'post',
            'propfind',
            'proppatch',
            'purge',
            'put',
            'report',
            'search',
            'subscribe',
            'trace',
            'unlock',
            'unsubscribe'
        ], function(method) {
            methods[method] = function(endpoint, cb) {
                register(method, endpoint, cb);
            };
        });
        return methods;
    };

    let out = function(base, cb) {
        cb(route(base));
    };
    out.setErrorHandler = function(cb) {
        handler = cb;
    };

    return out;
};
