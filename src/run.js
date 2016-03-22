'use strict';

const Generator = (function*(){}).constructor;
const isGenerator = runnable => runnable instanceof Generator;

let out = function(runnable, thisArg) {
    let run = (it) => {
        it = it || runnable;
        return new Promise((resolve, reject) => {
            let cur = it.next();
            let then = deferred => {
                return deferred.then(result => {
                    cur = it.next(result);
                    exec();
                }).catch(reject);
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
out.isGenerator = isGenerator;
module.exports = () => out;

