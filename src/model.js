'use strict';

const shortid = require('shortid');

module.exports = function(
    apiError,
    log,
    util,
    _,
    db,
    admin
) {

    let rule = function(regex, message) {
        return  {
            test: function(value) {
                return regex.test(value);
            },
            message: message
        };
    };

    let valid = {
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

    let createModelTable = function(name) {
        return db.query(`
            create table if not exists ${name} (
                id text primary key not null,
                data jsonb
            );
        `).then(function() {
            util.log(`load table ${name}`);
        });
    };

    let params = function(obj) {
        let id = obj._id;
        obj = _.cloneDeep(obj);
        delete obj._id;
        return [id, JSON.stringify(obj)];
    };

    const JSONB = `data || jsonb_build_object('_id', id) as data`;

    let model = function(descriptor) {
        createModelTable(descriptor.table);
        let createQuery = db.prepare(`${descriptor.table.toUpperCase()}_CREATE`, `
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
                let self = this;
                _.forEach(descriptor.properties, (rule, property) => {
                    self[property] = obj[property];
                });
            }
            create() {
                return createQuery(params(this)).then(() => this);
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
                if(obj) {
                    _.forEach(obj, (value, property) => {
                        this[property] = value;
                    });
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
                            reject(apiError(rule.message));
                        }
                    });
                    resolve(new Model(obj));
                });
            }
            safe(override) {
                let protect = _.cloneDeep(descriptor.protect);
                if(override && _.isArray(protect)) {
                    override = _.isArray(override) ? override : [override];
                    override.unshift(protect);
                    protect = _.without.apply(_, override);
                }
                let out = {};
                let properties = _.cloneDeep(descriptor.properties);
                properties._id = this._id;
                _.forEach(properties, ($, property) => {
                    if(!_.includes(protect, property)) {
                        out[property] = this[property];
                    }
                });
                return out;
            }
        }

        Model.createQuery = createQuery;
        Model.readQuery = readQuery;
        Model.updateQuery = updateQuery;
        Model.deleteQuery = deleteQuery;

        if(descriptor.queries) {

            _.forEach(descriptor.queries, function(query, key) {
                let name = `${descriptor.table.toUpperCase()}_${key.toUpperCase()}`;
                let statement = db.prepare(name, query);
                Model[name] = statement;
                let of = promise => {
                    promise.of = T => promise.then(result => new T(result));
                };
                let model = promise => {
                    promise.model = () => promise.then(result => new Model(result));
                };
                let one = promise => {
                    promise.one = () => {
                        let then = promise.then(result => result[0])
                        of(then);
                        model(then);
                        return then;
                    };
                };
                let unique = promise => {
                    promise.unique = err => {
                        let then = promise.then(result => {
                            if(result.length > 1) {
                                err = err || apiError.serverError(new Error(`Non-unique result in query ${name}`));
                                if(err instanceof Error) {
                                    throw err;
                                }
                                if(err instanceof Promise) {
                                    return err;
                                }
                                return apiError.serverError(new Error(err));
                            }
                            return result[0];
                        });
                        of(then);
                        model(then);
                        return then;
                    };
                };
                let listOf = promise => {
                    promise.of = T => promise.then(result =>
                        _.map(result, row => new T(row))
                    );
                };
                let models = promise => {
                    promise.model = () => promise.then(result =>
                       _.map(result, row => new Model(row))
                    );
                };
                Model[key] = function() {
                    let promise = statement.apply(db, arguments).then(function(result) {
                        return result.rows.map(row => row.data);
                    });
                    promise.required = err => {
                        promise.then(result => {
                            if(!result || !result.length || result.length < 1) {
                                err = err || apiError.notFound();
                                if(err instanceof Error) {
                                    throw err;
                                }
                                if(err instanceof Promise) {
                                    return err;
                                }
                                return apiError.notFound(err);
                            }
                            return result;
                        });
                        unique(promise);
                        one(promise);
                        listOf(promise);
                        models(promise);
                        return promise;
                    };
                    unique(promise);
                    one(promise);
                    listOf(promise);
                    models(promise);
                    return promise
                };
            });
        }

        admin.register(descriptor, Model);

        return Model;
    };

    model.valid = valid;
    model.createModelTable = createModelTable;
    model.shortid = shortid;
    model.JSONB = JSONB;

    return model;
};
