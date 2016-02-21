'use strict';
/**
 * ## License
 * [The MIT License (MIT)](http://www.opensource.org/licenses/mit-license.html)
 *
 * Copyright (c) 2015 Beg.in
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * @module license
 */

var path = require('path');
var util = require('util');
var _ = require('lodash');
var express = require('express');
var compress = require('compression');
var app = express();
var bodyParser = require('body-parser');
var throng = require('throng');
var $p = require('nodep')();

app.use(compress());
app.use(bodyParser.json());

/**
 * # Fritz
 * @module introduction
 */
var fritz = function(config) {

    config = config || {};
    config = _.defaultsDeep(config, {
        paths: {
            src: path.resolve('src'),
            fritz: path.resolve('.'),
            cwd: process.cwd()
        },
        pg: {
            user: process.env.PG_USER,
            pass: process.env.PG_PASS,
            host: process.env.PG_HOST,
            port: process.env.PG_PORT,
            db: process.env.PG_DB,
            url: process.env.DATABASE_URL
        },
        isDev: process.env.NODE_ENV === 'dev',
        port: process.env.PORT || 8081,
        workers: process.env.WEB_CONCURRENCY || 1,
        debug: !!process.env.NODE_DEBUG
    });

    $p.init({
        path: path,
        util: util,
        _: _,
        express: express,
        app: app,
        config: config
    }).init('src/**/*');

    if(config.isDev) {
        app.use(require('connect-livereload')());
        //app.use('/fonts', express.static(config.paths.fontsDev));
    } else {
        // TODO add cache control
        // var oneDay = 86400000;
        // app.use(express.static(__dirname + '/public', { maxAge: oneDay }));
    }

    return {
        provider: $p,
        static: $p.dependencies.static,
        model: $p.dependencies.model,
        route: $p.dependencies.route,
        db: $p.dependencies.db,
        start: function() {
            var listen = function() {
                util.log('start worker');
                app.listen(config.port);
            };

            //app.use(express.static(config.env.root));
            if(config.debug) {
                listen();
            } else {
                throng(listen, {
                    workers: config.workers,
                    lifetime: Infinity
                });
            }
        }
    };
};

module.exports = fritz;
