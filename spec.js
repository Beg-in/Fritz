'use strict';

var assert = require('assert');
var path = require('path');
var _ = require('lodash');
var $p = require('nodep')();
var config = require('./config');

$p.init({
    assert: assert,
    path: path,
    _: _,
    config: config
}).init('test/**/*');

