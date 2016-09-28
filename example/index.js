'use strict';

var fritz = require('../index')();

/*
var Test = class extends fritz.model({
    table: 'profiles',
    properties: {
        email: fritz.model.valid.email,
        bio: fritz.model.valid.nullable
    },
    queries: {
        getAll: `
            select *
            from Test;
        `,
        getByEmail: `
            select *
            from Test
            where data->>'email' = $1;
        `
    }
}) {
    // Test specific class structure here
    constructor() {
        super(obj);
    }
};
*/

/*
fritz.route('api/v1/test', function(method) {
    method.get('all', function() {
        return Test.getAll().then(function(result) {
            return result.rows;
        });
    });

    method.post('email', function(req, body) {
        return Test.getByEmail(body.email).then(function(result) {
            return result.rows;
        });
    });
});
*/

fritz.static('example/public');

fritz.start();

