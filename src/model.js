'use strict';

var shortid = require('shortid');

module.exports = function(util, _, db) {

    var rule = function(regex, message) {
        return  {
            test: function(value) {
                return regex.test(value);
            },
            message: message
        };
    };

     var valid = {
        rule: rule,
        id: {
            test: shortid.isValid,
            message: 'Not a valid id'
        },
        nonempty: rule(
            /^(?!\\s*$).+/,
            'Must not be empty'
        ),
        name: rule(
            /^(?!\\s*$).{2,}/,
            'Must be at least two characters'
        ),
        email: rule(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Must be a valid email address'
        ),
        password: rule(
            /.{8,}/,
            'Must be at least 8 characters in length'
        ),
        nullable: {
           test: function() {
                return true;
            }
        }
    };

    var createModelTable = function(name) {
        return db.query(`
            create table if not exists ${name} (
                id text primary key not null,
                data jsonb
            );
        `).then(function() {
            util.log(`load table ${name}`);
        });
    };

    var params = function(obj) {
        var id = obj._id;
        obj = _.cloneDeep(obj);
        delete obj._id;
        return [id, JSON.stringify(obj)];
    };

    const JSONB = `data || jsonb_build_object('_id', id) as data`;

    var model = function(descriptor) {
        createModelTable(descriptor.table);
        var createQuery = db.prepare(`${descriptor.table.toUpperCase()}_CREATE`, `
            insert
            into ${descriptor.table}
            values($1, $2);
        `);
        var readQuery = db.prepare(`${descriptor.table.toUpperCase()}_READ`, `
            select ${JSONB}
            from ${descriptor.table}
            where id = $1;
        `);
        var updateQuery = db.prepare(`${descriptor.table.toUpperCase()}_UPDATE`, `
            update ${descriptor.table}
            set data = $2
            where id = $1;
        `);
        var deleteQuery = db.prepare(`${descriptor.table.toUpperCase()}_DELETE`, `
            delete
            from ${descriptor.table}
            where id = $1
        `);

        class Model {
            constructor(obj) {
                this._id = valid.id.test(obj._id) ? obj._id : shortid.generate();
                _.forEach(descriptor.properties, function(rule, property) {
                    this[property] = obj[property];
                }, this);
            }
            create() {
                var self = this;
                return createQuery(params(this)).then(function() {
                    return self;
                });
            }
            static create(obj) {
                return Model.validate(obj).then(function(result) {
                    return result.create().then(function() {
                        return result;
                    });
                });
            }
            static read(id) {
                return readQuery(id).then(function(result) {
                    if(result.rows.length !== 1) {
                        throw new Error(`Unexpected row count: ${result.rows.length}`)
                    }
                    return new Model(result.rows[0].data);
                });
            }
            update(obj) {
                var self = this;
                if(obj) {
                    _.forEach(obj, function(value, property) {
                        this[property] = value;
                    }, this);
                }
                return Model.validate(this).then(function() {
                    return updateQuery(params(self));
                }).then(function() {
                    return self;
                });
            }
            delete() {
                return deleteQuery(this._id);
            }
            static delete() {
                return deleteQuery(id);
            }
            static validate(obj) {
                return new Promise(function(resolve, reject) {
                    _.forEach(descriptor.properties, function(rule, property) {
                        if(!rule.test(obj[property])) {
                            reject(rule.message);
                        }
                    });
                    resolve(new Model(obj));
                });
            }
        }

        Model.createQuery = createQuery;
        Model.readQuery = readQuery;
        Model.updateQuery = updateQuery;
        Model.deleteQuery = deleteQuery;

        if(descriptor.queries) {
            _.forEach(descriptor.queries, function(query, key) {
                var name = `${descriptor.table.toUpperCase()}_${key.toUpperCase()}`;
                var statement = db.prepare(name, query);
                Model[name] = statement;
                Model[key] = function() {
                    return statement.apply(db, arguments).then(function(result) {
                        if(result.rows.length < 1) {
                            throw new Error(`No result found in query ${name}`);
                        }
                        if(result.rows.length === 1) {
                            return result.rows[0].data;
                        }
                        return result.rows.map(row => row.data);
                    });
                };
            });
        }

        return Model;
    };

    model.valid = valid;
    model.createModelTable = createModelTable;
    model.shortid = shortid;
    model.JSONB = JSONB;

    return model;
};
