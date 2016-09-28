'use strict';

var _       = require('lodash');
var util    = require('util');

var admin   = require('../src/admin');
var model   = require('../src/model');

module.exports = function(assert) {

    /*
    describe('createTable', function() {
        it('should add table and reflect it in admin!', function() {

            var dbInstance = {
                prepare: function() {
                    return function() {
                        return Promise.resolve();
                    };
                },
                query: function() {
                    return Promise.resolve();
                }
            };

            var adminInstance = admin();
            var modelInstance = model(util, _, dbInstance, adminInstance);

            console.log(adminInstance);
            modelInstance.createModelTable('wow');
            console.log(adminInstance);
            assert('wow' in adminInstance.tables);

        });
    });
    */
};
