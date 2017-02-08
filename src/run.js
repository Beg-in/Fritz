'use strict';

const Generator = (function*(){}).constructor;
const isGenerator = runnable => runnable instanceof Generator;

/**
 * ## Run (promise helper)
 * Run is heavily based on [Co](https://github.com/tj/co)
 *
 * This allows you to use the `yield` keyword to extract results from promises.
 * ```js
 *
 * let generated = run(function*(arg1) { // notice the "*" in function
 *     // operate on promises in an imperative syntax
 *     // execution is asynchronously halted until the promise is resolved
 *     let result = yield Promise.resolve(arg1);
 *     return result;
 * });
 *
 * // run wrapped generators return a promise
 * // Any rejected promise will reject the resulting promise
 * generated('Snowball').then(result => console.log(result));
 *
 * ```
 * @namespace
 * @function run
 * @param {Generator|Runnable} runnable The generator function to run
 * @param {Object} thisArg The this instance to bind the function to
 * @returns {Promise} a promise resolved with a returned result
 * @module run
 */
let out = function(runnable, thisArg) {
    let run = (it) => {
        it = it || runnable;
        return new Promise((resolve, reject) => {
            let cur = it.next();
            let then = deferred => {
                return deferred.then(result => {
                    cur = it.next(result);
                    exec();
                    return null;
                }).catch(err => {
                    try {
                        cur = it.throw(err);
                        exec();
                    } catch(err) {
                        reject(err)
                    }
                });
            };
            let exec = () => {
                if(cur.done) return resolve(cur.value);
                if(cur.value instanceof Array) return then(Promise.all(cur.value));
                if(cur.value instanceof Promise) return then(cur.value);
                cur = it.next(cur.value);
                exec();
            };
            exec();
        });
    };
    if(isGenerator(runnable)) {
        return function() {
            return run(runnable.apply(thisArg || runnable, arguments));
        }
    }
    return run();
};

/**
 * @constant
 * @type {Function}
 * @param {Generator} runnable The generator function to check
 * @returns {Boolean} is runnable a generator function
 * @memberof run
 */
out.isGenerator = isGenerator;
module.exports = () => out;

