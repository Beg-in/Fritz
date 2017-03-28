'use strict';

var pg = require('pg');

module.exports = function(_, config) {

    var type = {
        NOT_FOUND: 'NOT_FOUND',
        NON_UNIQUE_RESULT: 'NON_UNIQUE_RESULT',
        CONNECTION: 'CONNECTION',
        QUERY: 'QUERY'
    };

    class DBError extends Error {
        constructor(type, message) {
            super(message);
            this.type = type;
        }
        static PG(type, message, err) {
            var output = new DBError(type, message);
            output.original = err.original || err.message;
            Object.keys(err).forEach(key => {
                if(key !== 'message' && key !== 'type') {
                    output[key] = err[key];
                }
            });
            return output;
        }
        get TYPE() {
            return type;
        }
        static notFound(message) {
            return new DBError(type.NOT_FOUND, message);
        }
        static nonUniqueResult(message) {
            return new DBError(type.NON_UNIQUE_RESULT, message);
        }
        static connection(err) {
            return DBError.PG(type.CONNECTION, 'error fetching client from pool', err);
        }
        static query(err, name) {
            return DBError.PG(type.QUERY, `error running query${name ? ' ' + name : ''}`, err);
        }
    }

    var connect = function() {
        return new Promise(function(resolve, reject) {
            var details = config.pg.url || {
                user: config.pg.user,
                password: config.pg.pass,
                host: config.pg.host,
                port: config.pg.port,
                database: config.pg.db,
                ssl: config.pg.ssl
            };
            pg.connect(details, function(err, client, done) {
                if(err) {
                    reject(DBError.connection(err));
                } else {
                    resolve({
                        client: client,
                        done: done
                    });
                }
            });
        });
    };

    var query = function() {
        var args = arguments;
        return new Promise(function(resolve, reject) {
            connect().then(function(connection) {
                connection.client.query.apply(connection.client, args).on('row', function(row, result) {
                    result.addRow(row);
                }).on('end', function(result) {
                    resolve(result);
                    connection.done();
                }).on('error', function(err) {
                    reject(DBError.query(err));
                });
            }).catch(reject);
        });
    };

    return {
        pg: pg,
        connect: connect,
        query: query,
        Error: DBError,
        prepare: function(name, text) {
            return function(values) {
                if(!_.isArray(values)) {
                    values = [values];
                }
                return query({
                    name: name,
                    text: text,
                    values: values
                }).catch(function(err) {
                    throw DBError.query(err, name);
                });
            };
        },
        transaction: function(cb) {
            return query('BEGIN').then(cb).then(function() {
                return query('COMMIT');
            }).catch(function(err) {
                query('ROLLBACK');
                throw err instanceof Error ? err : new Error(err);
            });
        }
    };
};
