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
                console.log('query', arguments);
                return Promise.resolve();
            }
        };

        beforeEach(function() {
        });

        it('should create table', function() {
            // Mock DB
            var instance = model(util, _, db);

            instance({table: 'Test'});
        });
    });
};
