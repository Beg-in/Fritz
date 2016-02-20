'use strict';

var model = require('../src/model');
var util = require('util');
var _ = require('lodash');

module.exports = function(assert) {
    describe('model', function() {
        var db = {
            prepare: function() {
                return function() {
                    return Promise.resolve();
                };
            },
            query: function() {
                return Promise.resolve();
            }
        };

        beforeEach(function() {
        });

        it('should register model', function() {
            var expected = {table: 'Test'};
            var actual;

            var admin = {
                register: function(descriptor) {
                    actual = descriptor;
                }
            };
            // Mock DB
            var instance = model(util, _, db, admin);

            instance(expected);

            assert.equal(expected, actual);
        });
    });
};
