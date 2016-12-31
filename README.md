# Fritz
[![Gitter](https://badges.gitter.im/Beg-in/Fritz.svg)](https://gitter.im/Beg-in/Fritz?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)


## Route

### Creating routes
```js
// create a base route
route('api/v1/test', function(method) {

    // bind a "GET" method to the base
    method.get(function(req, res) {
        // req and res are from Express

        // return plain values
        return 'hello world';
    });

    // interceptors
    let alwaysDo = function(req, res) {
        // treat this as Express middleware
        // must return a promise
        return Promse.resolve(true);
    };
    // intercept every route in this scope
    method.beforeEach(alwaysDo);

    // interceptor can be a generator and will execute in Fritz.run
    let requireLogin = function*() {
       return true;
    };
    // intercept only the next route
    method(requireLogin);

    // bind a "POST" method to the base
    // myroute will be appended to the route route from this scope
    // e.g. "/api/v1/test/myroute"
    method.post('myroute', function*(req, res) {
        // can be a generator and will execute in Fritz.run

        // return JSON type
        return {
            test: 'result'
        };
    });

    // multiple methods on the same route
    method.put('myroute', function(req, res) {
        // return type Promise - response will extract the resolved value
        return Promise.resolve('resolved value');
    });

    // use Express route parameters
    method.delete('myroute/:id', function(req, res) {
        // return type Promise - response will extract the resolved value
        return Promise.resolve('resolved value');
    });

    // All of the following are valid methods
    method.all
    method.checkout
    method.connect
    method.copy
    method.delete
    method.get
    method.head
    method.lock
    method.merge
    method.mkactivity
    method.mkcol
    method.move
    method['m-search']
    method.notify
    method.options
    method.patch
    method.post
    method.propfind
    method.proppatch
    method.purge
    method.put
    method.report
    method.search
    method.subscribe
    method.trace
    method.unlock
    method.unsubscribe
});
```
### Interceptors
Interceptors function the same as Express middleware.
- i.e. arguments will be (request, response)
- must be a function
- They will be executed before the folowing route(s)
- They are expected to return a promise
- Rejection will result in an error response
- Resolve will result in continuing the request chain


## Model

### Creating a model
```js
let MyModel = class extends model({
    // This will be your table name in PostgreSQL
    table: 'MyModel',

    // a list of properties that an instance of
    // MyModel will have. Each property key will
    // need to have a value that declares how to
    // validate the property
    properties: {
        // any key from the valid object can be used
        name: model.valid.name, // 2 characters
        email: model.valid.email, // email addresses
        pass: model.valid.password, // 8 characters
        child: model.valid.id, // validate shortids
        description: model.valid.nonempty, // 1 character
        achievements: model.valid.nullable, // can be empty
        // custom validation objects can also be used
        custom: {
            test: function(value) {
                // a custom function for this property
                return true;
            },
            message: 'a string to display on error'
        }
    },

    // Protect is an array of property names to exclude
    // when calling the safe() method on an instance
    // of MyModel
    protect: [
        'pass' // the property "pass" will not be output
    ],

    // Queries are a list of string queries
    // that will be turned into prepared statements
    // access them with MyModel.{myQueryName}
    // e.g. in this example: MyModel.getAll();
    queries: {
        getAll: `
            select ${model.JSONB}
            from MyModel;
        `,
        // query argument is inserted at $1
        // arguments are inserted in the order of the array
        // 
        getByEmail: `
            select ${model.JSONB}
            from MyModel
            where data->>'email' = $1;
        `
    }
}) {
    // If you extend the returned class you can set
    // the constructor, instance methods, and static methods
    constructor(obj) {
        super(obj);
    }
};
```

### Constructing a model and save it to the database
```js
MyModel.validate({
    name: 'Rick Sanchez',
    email: 'rick@rickandmortyforever.com',
    pass: 'supersecret',
    child: morty._id,
    description: 'The Rickest Rick'
}).then(instance => {
    // this is a valid instance
    return instance.create();
    // call safe() to strip protected properties
}).then(created => created.safe());
```

### Working with prepared statements
```js
// in the queries object create a query called "prepared"
let MyModel = model({
    ...
    queries: {
        prepared: `
            select ${model.JSONB}
            from MyModel
            where data->>'email' = $1;
        `
    }
    ...
});
// now prepared is available as a function.
let promise = MyModel.prepared(['value1', 'value2']);
// value1 will be inserted into the query at position "$1"
```

### ORM helpers on prepared statements
All ORM helpers return a Promise with special functions
```js
// of() transforms the result objects into MyModel type
let ofModel = MyModel.prepared().of();
// of(T) transforms the result objects into type T
let ofType = MyModel.prepared().of(MyOtherModel);

// unique(err) transforms the result to just the first result
// and will reject with err if there is more than one
let uniqueDefault = MyModel.prepared().unique(); // default error
let uniqueNoError = MyModel.prepared().unique(null); // do not error, resolve null
let uniqueCustom = MyModel.prepared().unique(apiError.conflict()); // custom error
// unique() Can chain with of()
let uniqueOf = MyModel.prepared().unique().of();

// required(err) will reject with err if there is no result
let manyDefault = MyModel.prepared().required(); // default error
let many = MyModel.prepared().required(apiError.noContent()); // custom error
// Can chain with of()
let manyOf = MyModel.prepared().required().of();
// required() Can chain with unique()
let requiredUnique = MyModel.prepared().required().unique();
let requiredUniqueOf = MyModel.prepared().required().unique().of();
```

### Putting it all together
```js
MyModel.getByEmail(['rick@rickandmortyforever.com'])
    .required()
    .unique()
    .of()
    .then(result => {
        // result will be unique and present
        // result is also of type MyModel
        return result.update({
            name: 'The Rickest Rick'
        }).then(result => result.safe());
    }).catch(err => {
        // result was non-unique or not present
    });
```


## Api Errors

All `apiError` functions return a rejected Promise
with an value of type `ApiError`. These promises will
have a property called `throwable` that returns the
ApiError. If these promises are returned to a Fritz
route, they will result in a http response with the
appropriate error code and will be formatted by the
function at `apiError.handler`.

### Usage
```js
// custom message and status code
apiError('a message to reject with', 200);

// Bad Request (400)
apiError(); // default message
apiError('a message to reject with'); // custom message

// respond with Internal Server Error (204)
apiError.fatal();
apiError.fatal('a message to log');
apiError(new Error());

// All `apiError` functions accept a single parameter for the message
apiError.badRequest('a message to reject with');

// Additional `apiError` error functions
apiError.noContent(); // No Content (204)
apiError.badRequest(); // Bad Request (400)
apiError.unauthorized(); // Unauthorized (401)
apiError.paymentRequired(); // Payment Required (402)
apiError.forbidden(); // Forbidden (403)
apiError.notFound(); // Not Found (404)
apiError.methodNotAllowed(); // Method Not Allowed (405)
apiError.conflict(); // Conflict (409)
apiError.unsupportedMediaType(); // Unsupported Media Type (415)
apiError.serverError(); // Internal Server Error (500)
```


## Run (promise helper)
Run is heavily based on [Co](https://github.com/tj/co)

This allows you to use the `yield` keyword to extract results from promises.
```js

let generated = run(function*(arg1) { // notice the "*" in function
    // operate on promises in an imperative syntax
    // execution is asynchronously halted until the promise is resolved
    let result = yield Promise.resolve(arg1);
    return result;
});

// run wrapped generators return a promise
// Any rejected promise will reject the resulting promise
generated('Snowball').then(result => console.log(result));

```

**Returns**: <code>Promise</code> - a promise resolved with a returned result  

| Param | Type | Description |
| --- | --- | --- |
| runnable | <code>Generator</code> &#124; <code>Runnable</code> | The generator function to run |
| thisArg | <code>Object</code> | The this instance to bind the function to |


## Log
Wrapper for [Winston](https://github.com/winstonjs/winston)
### Logging
```js
log('a message to log');
log.info('an info message to log');
log.warn('an warn message to log');
log.error('an error message to log');

// set loggers for Winston
log.setLogger([
     {
         type: 'Console',
         colorize: true,
         level: 'debug'
     }
])
```


## Build
### Requirements
- [Postgresql](http://www.postgresql.org/)

#### Setup
```bash
$ npm run setup
```

This installs the following globally:
- [Gulp](http://gulpjs.com/)
- [Bower](http://bower.io/)
- [Node Foreman](http://strongloop.github.io/node-foreman/)
- [Node Inspector](https://github.com/node-inspector/node-inspector)

Then install the required Node dependencies with:
```bash
$ npm install
```

Add a file called `.env` to the root of the project with the following contents:
```json
{
    "node": {
        "env": "dev"
    }
}
```
You can now run the development server by running the following commands:
```bash
$ npm start
```

- You can now visit [http://localhost:8081/](http://localhost:8081/) to view changes live.

#### Serverside runtime
- Uses dependency injection from [Nodep](http://nodep.org)

### Running the test suite
#### Single Run:
```bash
$ gulp test
```
#### Continuous testing when files are changed:
```bash
$ gulp autotest
```
### Generating README.md
```bash
$ gulp docs
```
### Generating CHANGELOG.md
```bash
$ gulp changelog
```
### Notes
- jshint is part of the test suite and should be kept clean
- Commits should have high test coverage
- Docs should be kept up to date
- Additions should come with documentation
- commit messages should follow [Angular conventional format](https://github.com/stevemao/conventional-changelog-angular/blob/master/convention.md)



# API Reference

<a name="module_model"></a>

## model : <code>function</code>
<a name="module_model..Model"></a>

### model~Model
**Kind**: inner class of <code>[model](#module_model)</code>  

* [~Model](#module_model..Model)
    * [new Model()](#new_module_model..Model_new)
    * _instance_
        * [.create()](#module_model..Model+create) ⇒ <code>Promise</code>
        * [.update(obj)](#module_model..Model+update) ⇒ <code>Promise</code>
        * [.delete()](#module_model..Model+delete) ⇒ <code>Promise</code>
        * [.safe(override)](#module_model..Model+safe) ⇒ <code>Object</code>
    * _static_
        * [.createQuery](#module_model..Model.createQuery)
        * [.readQuery](#module_model..Model.readQuery)
        * [.updateQuery](#module_model..Model.updateQuery)
        * [.deleteQuery](#module_model..Model.deleteQuery)
        * [.create(obj)](#module_model..Model.create) ⇒ <code>Promise</code>
        * [.read(id)](#module_model..Model.read) ⇒ <code>Promise</code>
        * [.delete(id)](#module_model..Model.delete) ⇒ <code>Promise</code>
        * [.validate(obj)](#module_model..Model.validate) ⇒ <code>Promise</code>

<a name="new_module_model..Model_new"></a>

#### new Model()
The generated Model class output

<a name="module_model..Model+create"></a>

#### model.create() ⇒ <code>Promise</code>
Create an object in the database from this instance

**Kind**: instance method of <code>[Model](#module_model..Model)</code>  
**Returns**: <code>Promise</code> - result will contain this object  
<a name="module_model..Model+update"></a>

#### model.update(obj) ⇒ <code>Promise</code>
Update an existing object in the database

**Kind**: instance method of <code>[Model](#module_model..Model)</code>  
**Returns**: <code>Promise</code> - result will be an instance with updated properties  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>Object</code> | an object with properties to update in this instance |

<a name="module_model..Model+delete"></a>

#### model.delete() ⇒ <code>Promise</code>
Delete this object in the database

**Kind**: instance method of <code>[Model](#module_model..Model)</code>  
<a name="module_model..Model+safe"></a>

#### model.safe(override) ⇒ <code>Object</code>
Generate an object that does not have protected properties

**Kind**: instance method of <code>[Model](#module_model..Model)</code>  
**Returns**: <code>Object</code> - a consumable object of this instance  

| Param | Type | Description |
| --- | --- | --- |
| override | <code>String</code> &#124; <code>Array.&lt;String&gt;</code> | parameters to allow that are marked protected |

<a name="module_model..Model.createQuery"></a>

#### Model.createQuery
A prepared statement to create this model in the database

**Kind**: static property of <code>[Model](#module_model..Model)</code>  
**See**: db.prepare  
<a name="module_model..Model.readQuery"></a>

#### Model.readQuery
A prepared statement to read this model from the database

**Kind**: static property of <code>[Model](#module_model..Model)</code>  
**See**: db.prepare  
<a name="module_model..Model.updateQuery"></a>

#### Model.updateQuery
A prepared statement to update this model in the database

**Kind**: static property of <code>[Model](#module_model..Model)</code>  
**See**: db.prepare  
<a name="module_model..Model.deleteQuery"></a>

#### Model.deleteQuery
A prepared statement to delete this model from the database

**Kind**: static property of <code>[Model](#module_model..Model)</code>  
**See**: db.prepare  
<a name="module_model..Model.create"></a>

#### Model.create(obj) ⇒ <code>Promise</code>
Create an object in the database from a validated instance

**Kind**: static method of <code>[Model](#module_model..Model)</code>  
**Returns**: <code>Promise</code> - result will contain the validated object  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>Object</code> | the object to validate and insert into the database |

<a name="module_model..Model.read"></a>

#### Model.read(id) ⇒ <code>Promise</code>
Read an object with the id from the database

**Kind**: static method of <code>[Model](#module_model..Model)</code>  
**Returns**: <code>Promise</code> - an object referred to by id  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | the id of the object to find |

<a name="module_model..Model.delete"></a>

#### Model.delete(id) ⇒ <code>Promise</code>
Delete an object in the database with id

**Kind**: static method of <code>[Model](#module_model..Model)</code>  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | the id of the object to delete |

<a name="module_model..Model.validate"></a>

#### Model.validate(obj) ⇒ <code>Promise</code>
Validate an object against property rules

**Kind**: static method of <code>[Model](#module_model..Model)</code>  
**Returns**: <code>Promise</code> - the result will be a validated instance of this Model  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>Object</code> | the object to create |

<a name="module_model..valid"></a>

### model~valid : <code>Object</code>
A table of default validation rules

**Kind**: inner constant of <code>[model](#module_model)</code>  

* [~valid](#module_model..valid) : <code>Object</code>
    * [.id](#module_model..valid.id) : <code>Object</code>
    * [.nonempty](#module_model..valid.nonempty) : <code>Object</code>
    * [.name](#module_model..valid.name) : <code>Object</code>
    * [.email](#module_model..valid.email) : <code>Object</code>
    * [.password](#module_model..valid.password) : <code>Object</code>
    * [.nullable](#module_model..valid.nullable) : <code>Object</code>

<a name="module_model..valid.id"></a>

#### valid.id : <code>Object</code>
Validation type requiring a valid shortid

**Kind**: static constant of <code>[valid](#module_model..valid)</code>  
**Example**  
```
let validator = model.valid.id;
```
<a name="module_model..valid.nonempty"></a>

#### valid.nonempty : <code>Object</code>
Validation type requiring at least single character

**Kind**: static constant of <code>[valid](#module_model..valid)</code>  
**Example**  
```
let validator = model.valid.nonempty;
```
<a name="module_model..valid.name"></a>

#### valid.name : <code>Object</code>
Validation type requiring at least two characters

**Kind**: static constant of <code>[valid](#module_model..valid)</code>  
**Example**  
```
let validator = model.valid.name;
```
<a name="module_model..valid.email"></a>

#### valid.email : <code>Object</code>
Validation type requiring a valid email address

**Kind**: static constant of <code>[valid](#module_model..valid)</code>  
**Example**  
```
let validator = model.valid.email;
```
<a name="module_model..valid.password"></a>

#### valid.password : <code>Object</code>
Validation type requiring at least 8 characters

**Kind**: static constant of <code>[valid](#module_model..valid)</code>  
**Example**  
```
let validator = model.valid.password;
```
<a name="module_model..valid.nullable"></a>

#### valid.nullable : <code>Object</code>
Validation type requiring nothing at all

**Kind**: static constant of <code>[valid](#module_model..valid)</code>  
**Example**  
```
let validator = model.valid.nullable;
```
<a name="module_model..model"></a>

### model~model(descriptor) ⇒ <code>Model</code>
Generate a model class

**Kind**: inner method of <code>[model](#module_model)</code>  
**Returns**: <code>Model</code> - a generated Model class  

| Param | Type | Description |
| --- | --- | --- |
| descriptor | <code>Object</code> | Configuration for the model class to generate |


* [~model(descriptor)](#module_model..model) ⇒ <code>Model</code>
    * [.shortid](#module_model..model.shortid) : <code>Object</code>
    * [.JSONB](#module_model..model.JSONB) : <code>String</code>
    * [.createModelTable()](#module_model..model.createModelTable) ⇒ <code>Object</code>

<a name="module_model..model.shortid"></a>

#### model.shortid : <code>Object</code>
A reference to shortid the engine used to generate ids

**Kind**: static constant of <code>[model](#module_model..model)</code>  
<a name="module_model..model.JSONB"></a>

#### model.JSONB : <code>String</code>
Helper text to select JSONB data with an embedded `_id` primary key

**Kind**: static constant of <code>[model](#module_model..model)</code>  
**Example**  
```js
let query = `select ${model.JSONB} from MyTable`;
```
<a name="module_model..model.createModelTable"></a>

#### model.createModelTable() ⇒ <code>Object</code>
A reference to shortid the engine used to generate ids

**Kind**: static method of <code>[model](#module_model..model)</code>  

## License
[The MIT License (MIT)](http://www.opensource.org/licenses/mit-license.html)

Copyright (c) 2015 Beg.in

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.


