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

    /**
     * ## Route
     *
     * ### Creating routes
     * ```js
     * // create a base route
     * route('api/v1/test', function(method) {
     *
     *     // bind a "GET" method to the base
     *     method.get(function(req, res) {
     *         // req and res are from Express
     *
     *         // return plain values
     *         return 'hello world';
     *     });
     *
     *     // interceptors
     *     let alwaysDo = function(req, res) {
     *         // treat this as Express middleware
     *         // must return a promise
     *         return Promse.resolve(true);
     *     };
     *     // intercept every route in this scope
     *     method.beforeEach(alwaysDo);
     *
     *     // interceptor can be a generator and will execute in Fritz.run
     *     let requireLogin = function*() {
     *        return true;
     *     };
     *     // intercept only the next route
     *     method(requireLogin);
     *
     *     // bind a "POST" method to the base
     *     // myroute will be appended to the route route from this scope
     *     // e.g. "/api/v1/test/myroute"
     *     method.post('myroute', function*(req, res) {
     *         // can be a generator and will execute in Fritz.run
     *
     *         // return JSON type
     *         return {
     *             test: 'result'
     *         };
     *     });
     *
     *     // multiple methods on the same route
     *     method.put('myroute', function(req, res) {
     *         // return type Promise - response will extract the resolved value
     *         return Promise.resolve('resolved value');
     *     });
     *
     *     // use Express route parameters
     *     method.delete('myroute/:id', function(req, res) {
     *         // return type Promise - response will extract the resolved value
     *         return Promise.resolve('resolved value');
     *     });
     *
     *     // All of the following are valid methods
     *     method.all
     *     method.checkout
     *     method.connect
     *     method.copy
     *     method.delete
     *     method.get
     *     method.head
     *     method.lock
     *     method.merge
     *     method.mkactivity
     *     method.mkcol
     *     method.move
     *     method['m-search']
     *     method.notify
     *     method.options
     *     method.patch
     *     method.post
     *     method.propfind
     *     method.proppatch
     *     method.purge
     *     method.put
     *     method.report
     *     method.search
     *     method.subscribe
     *     method.trace
     *     method.unlock
     *     method.unsubscribe
     * });
     * ```
     * ### Interceptors
     * Interceptors function the same as Express middleware.
     * - i.e. arguments will be (request, response)
     * - must be a function
     * - They will be executed before the folowing route(s)
     * - They are expected to return a promise
     * - Rejection will result in an error response
     * - Resolve will result in continuing the request chain
     * @namespace
     * @type {Function}
     * @module route
     */
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
