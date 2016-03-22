'use strict';

const assert = require('assert');
const run = require('../src/run')();

describe('run', () => {
    it('test', () => {
        return run(function*() {
            assert.equal(yield Promise.resolve(1), 1);
        })();
    });

    it('should return value', () => {
        return run(function*() {
            let one = Promise.resolve(1);
            return one;
        })().then(result => assert.equal(result, 1));
    });

    it('should apply arguments', () => {
        run(function*(arg) {
            return arg;
        })().then(result => assert.equal(result, 1));
    });

    it('should create and execute iterable', () => {
        return run(function*() {
            let one = yield Promise.resolve(1);
            let two = yield Promise.resolve(2);
            let three = yield [Promise.resolve(3), Promise.resolve(4)];
            assert.equal(one, 1);
            assert.equal(two, 2);
            assert.deepEqual(three, [3, 4]);
        })();
    });

    it('should execute existing iterable', () => {
        return run((function*() {
            let one = yield Promise.resolve(1);
            let two = yield Promise.resolve(2);
            let three = yield [Promise.resolve(3), Promise.resolve(4)];
            assert.equal(one, 1);
            assert.equal(two, 2);
            assert.deepEqual(three, [3, 4]);
        })());
    });

    it('should apply thisArg', () => {
        return ({
            one: 1,
            run: function() {
                return run(function*() {
                    assert.equal(this.one, 1);
                }, this)();
            }
        }).run();
    });

    it('should apply arguments', () => {
        return run(function*(one, two) {
            assert.equal(one, 1);
            assert.equal(two, 2);
        })(1, 2);
    });

    it('should have isGenerator', () => {
        assert(run.isGenerator(function*(){}));
        assert(!run.isGenerator(function(){}));
    });
});
