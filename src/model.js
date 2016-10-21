'use strict';

/**
 * @author Brian Jesse (@BrainBacon)
 */
const shortid = require('shortid');

/**
 * ## Model
 *
 * ### Creating a model
 * ```js
 * let MyModel = class extends model({
 *     // This will be your table name in PostgreSQL
 *     table: 'MyModel',
 *
 *     // a list of properties that an instance of
 *     // MyModel will have. Each property key will
 *     // need to have a value that declares how to
 *     // validate the property
 *     properties: {
 *         // any key from the valid object can be used
 *         name: model.valid.name, // 2 characters
 *         email: model.valid.email, // email addresses
 *         pass: model.valid.password, // 8 characters
 *         child: model.valid.id, // validate shortids
 *         description: model.valid.nonempty, // 1 character
 *         achievements: model.valid.nullable, // can be empty
 *         // custom validation objects can also be used
 *         custom: {
 *             test: function(value) {
 *                 // a custom function for this property
 *                 return true;
 *             },
 *             message: 'a string to display on error'
 *         }
 *     },
 *
 *     // Protect is an array of property names to exclude
 *     // when calling the safe() method on an instance
 *     // of MyModel
 *     protect: [
 *         'pass' // the property "pass" will not be output
 *     ],
 *
 *     // Queries are a list of string queries
 *     // that will be turned into prepared statements
 *     // access them with MyModel.{myQueryName}
 *     // e.g. in this example: MyModel.getAll();
 *     queries: {
 *         getAll: `
 *             select ${model.JSONB}
 *             from MyModel;
 *         `,
 *         // query argument is inserted at $1
 *         // arguments are inserted in the order of the array
 *         // 
 *         getByEmail: `
 *             select ${model.JSONB}
 *             from MyModel
 *             where data->>'email' = $1;
 *         `
 *     }
 * }) {
 *     // If you extend the returned class you can set
 *     // the constructor, instance methods, and static methods
 *     constructor(obj) {
 *         super(obj);
 *     }
 * };
 * ```
 *
 * ### Constructing a model and save it to the database
 * ```js
 * MyModel.validate({
 *     name: 'Rick Sanchez',
 *     email: 'rick@rickandmortyforever.com',
 *     pass: 'supersecret',
 *     child: morty._id,
 *     description: 'The Rickest Rick'
 * }).then(instance => {
 *     // this is a valid instance
 *     return instance.create();
 *     // call safe() to strip protected properties
 * }).then(created => created.safe());
 * ```
 *
 * ### Working with prepared statements
 * ```js
 * // in the queries object create a query called "prepared"
 * let MyModel = model({
 *     ...
 *     queries: {
 *         prepared: `
 *             select ${model.JSONB}
 *             from MyModel
 *             where data->>'email' = $1;
 *         `
 *     }
 *     ...
 * });
 * // now prepared is available as a function.
 * let promise = MyModel.prepared(['value1', 'value2']);
 * // value1 will be inserted into the query at position "$1"
 * ```
 *
 * ### ORM helpers on prepared statements
 * All ORM helpers return a Promise with special functions
 * ```js
 * // of() transforms the result objects into MyModel type
 * let ofModel = MyModel.prepared().of();
 * // of(T) transforms the result objects into type T
 * let ofType = MyModel.prepared().of(MyOtherModel);
 *
 * // unique(err) transforms the result to just the first result
 * // and will reject with err if there is more than one
 * let uniqueDefault = MyModel.prepared().unique(); // default error
 * let uniqueNoError = MyModel.prepared().unique(null); // do not error, resolve null
 * let uniqueCustom = MyModel.prepared().unique(apiError.conflict()); // custom error
 * // unique() Can chain with of()
 * let uniqueOf = MyModel.prepared().unique().of();
 *
 * // required(err) will reject with err if there is no result
 * let manyDefault = MyModel.prepared().required(); // default error
 * let many = MyModel.prepared().required(apiError.noContent()); // custom error
 * // Can chain with of()
 * let manyOf = MyModel.prepared().required().of();
 * // required() Can chain with unique()
 * let requiredUnique = MyModel.prepared().required().unique();
 * let requiredUniqueOf = MyModel.prepared().required().unique().of();
 * ```
 *
 * ### Putting it all together
 * ```js
 * MyModel.getByEmail(['rick@rickandmortyforever.com'])
 *     .required()
 *     .unique()
 *     .of()
 *     .then(result => {
 *         // result will be unique and present
 *         // result is also of type MyModel
 *         return result.update({
 *             name: 'The Rickest Rick'
 *         }).then(result => result.safe());
 *     }).catch(err => {
 *         // result was non-unique or not present
 *     });
 * ```
 * @namespace
 * @type {Function}
 * @module model
 */
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

    /**
     * A table of default validation rules
     * @constant
     * @type {Object}
     */
    let valid = {
        rule: rule,

        /**
         * Validation type requiring a valid shortid
         * @constant
         * @type {Object}
         * @example
         * ```
         * let validator = model.valid.id;
         * ```
         */
        id: {
            test: shortid.isValid,
            message: 'Not a valid id'
        },

        /**
         * Validation type requiring at least single character
         * @constant
         * @type {Object}
         * @example
         * ```
         * let validator = model.valid.nonempty;
         * ```
         */
        nonempty: rule(
            /^(?!\\s*$).+/,
            'Must not be empty'
        ),

        /**
         * Validation type requiring at least two characters
         * @constant
         * @type {Object}
         * @example
         * ```
         * let validator = model.valid.name;
         * ```
         */
        name: rule(
            /^(?!\\s*$).{2,}/,
            'Must be at least two characters'
        ),

        /**
         * Validation type requiring a valid email address
         * @constant
         * @type {Object}
         * @example
         * ```
         * let validator = model.valid.email;
         * ```
         */
        email: rule(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Must be a valid email address'
        ),

        /**
         * Validation type requiring at least 8 characters
         * @constant
         * @type {Object}
         * @example
         * ```
         * let validator = model.valid.password;
         * ```
         */
        password: rule(
            /.{8,}/,
            'Must be at least 8 characters in length'
        ),

        /**
         * Validation type requiring nothing at all
         * @constant
         * @type {Object}
         * @example
         * ```
         * let validator = model.valid.nullable;
         * ```
         */
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

    /**
     * Generate a model class
     * @function
     * @param {Object} descriptor Configuration for the model class to generate
     * @returns {Model} a generated Model class
     */
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

        /**
         * The generated Model class output
         * @class Model
         */
        class Model {
            constructor(obj) {
                this._id = valid.id.test(obj._id) ? obj._id : shortid.generate();
                _.forEach(descriptor.properties, (rule, property) => {
                    this[property] = obj[property];
                });
            }
            /**
             * Create an object in the database from this instance
             * @function
             * @returns {Promise} result will contain this object
             */
            create() {
                return createQuery(params(this)).then(() => this);
            }

            /**
             * Create an object in the database from a validated instance
             * @function
             * @static
             * @param {Object} obj the object to validate and insert into the database
             * @returns {Promise} result will contain the validated object
             */
            static create(obj) {
                return Model.validate(obj).then(function(result) {
                    return result.create().then(function() {
                        return result;
                    });
                });
            }

            /**
             * Read an object with the id from the database
             * @function
             * @static
             * @param {String} id the id of the object to find
             * @returns {Promise} an object referred to by id
             */
            static read(id) {
                return readQuery(id).then(function(result) {
                    if(result.rows.length !== 1) {
                        throw new Error(`Unexpected row count: ${result.rows.length}`)
                    }
                    return new Model(result.rows[0].data);
                });
            }

            /**
             * Update an existing object in the database
             * @function
             * @param {Object} obj an object with properties to update in this instance
             * @returns {Promise} result will be an instance with updated properties
             */
            update(obj) {
                if(obj) {
                    _.forEach(obj, (value, property) => {
                        this[property] = value;
                    });
                }
                return Model.validate(this)
                    .then(() => updateQuery(params(this)))
                    .then(() => this);
            }

            /**
             * Delete this object in the database
             * @function
             * @returns {Promise}
             */
            delete() {
                return deleteQuery(this._id);
            }

            /**
             * Delete an object in the database with id
             * @function
             * @static
             * @param {String} id the id of the object to delete
             * @returns {Promise}
             */
            static delete(id) {
                return deleteQuery(id);
            }

            /**
             * Validate an object against property rules
             * @function
             * @static
             * @param {Object} obj the object to create
             * @returns {Promise} the result will be a validated instance of this Model
             */
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

            /**
             * Generate an object that does not have protected properties
             * @function
             * @param {String|Array<String>} override parameters to allow that are marked protected
             * @returns {Object} a consumable object of this instance
             */
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

        /**
         * A prepared statement to create this model in the database
         * @see db.prepare
         */
        Model.createQuery = createQuery;

        /**
         * A prepared statement to read this model from the database
         * @see db.prepare
         */
        Model.readQuery = readQuery;

        /**
         * A prepared statement to update this model in the database
         * @see db.prepare
         */
        Model.updateQuery = updateQuery;

        /**
         * A prepared statement to delete this model from the database
         * @see db.prepare
         */
        Model.deleteQuery = deleteQuery;

        if(descriptor.queries) {
            _.forEach(descriptor.queries, function(query, key) {
                let name = `${descriptor.table.toUpperCase()}_${key.toUpperCase()}`;
                let statement = db.prepare(name, query);
                Model[name] = statement;

                let unique = promise => {

                    /**
                     * Get the first result from a prepared statement and reject if non-unique
                     * @function
                     * @param {Promise|Error|String|null} err the error to reject with if non-unique or null
                     * @returns {Promise} a transformed promise with only the first result
                     */
                    promise.unique = err => {
                        let then = promise.then(result => {
                            if(err === null) {
                                return null;
                            }
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

                        /**
                         * Transform prepared statement results into a class
                         * @function
                         * @param {Class|undefined} T the type of object to transform results into or this Model if undefined
                         * @returns {Promise} a transformed promise with on object of type T
                         */
                        then.of = T => {
                            T = T || Model;
                            return then.then(result => new T(result));
                        };
                        return then;
                    };
                };

                let listOf = promise => {
                    promise.of = T => promise.then(result => {
                        T = T || Model;
                        return _.map(result, row => new T(row));
                    });
                };

                /**
                 * Prepared statement generator
                 * @function
                 * @memberof Model
                 * @param {Array<String>|String} values the values to pass into the prepared statement
                 * @returns {Promise} the resulting promise
                 * @see db.prepare
                 */
                Model[key] = function() {
                    let promise = statement.apply(db, arguments).then(function(result) {
                        return result.rows.map(row => row.data);
                    });

                    /**
                     * Require at least one result
                     * @function
                     * @param {Promise|Error|String} err the error to reject with if no result
                     * @returns {Promise} the resulting promise
                     */
                    promise.required = err => {
                        let then = promise.then(result => {
                            if(!result || !result.length || result.length < 1) {
                                err = err || apiError.notFound();
                                if(err instanceof Error) {
                                    throw err;
                                }
                                if(err instanceof Promise) {
                                    console.log('instanceof promise');
                                    return err;
                                }
                                return apiError.notFound(err);
                            }
                            return result;
                        });
                        unique(then);
                        listOf(then);
                        return then;
                    };
                    unique(promise);
                    listOf(promise);
                    return promise
                };
            });
        }

        //admin.register(descriptor, Model);

        return Model;
    };

    model.valid = valid;

    /**
     * A reference to shortid the engine used to generate ids
     * @function
     * @type {Object}
     */
    model.createModelTable = createModelTable;

    /**
     * A reference to shortid the engine used to generate ids
     * @constant
     * @type {Object}
     */
    model.shortid = shortid;

    /**
     * Helper text to select JSONB data with an embedded `_id` primary key
     * @constant
     * @type {String}
     * @example
     * ```js
     * let query = `select ${model.JSONB} from MyTable`;
     * ```
     */
    model.JSONB = JSONB;

    return model;
};
