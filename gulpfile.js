'use strict';

var gulp = require('gulp');

/**
 * ## Build
 * ### Requirements
 * - [Postgresql](http://www.postgresql.org/)
 *
 * #### Setup
 * ```bash
 * $ npm run setup
 * ```
 *
 * This installs the following globally:
 * - [Gulp](http://gulpjs.com/)
 * - [Bower](http://bower.io/)
 * - [Node Foreman](http://strongloop.github.io/node-foreman/)
 * - [Node Inspector](https://github.com/node-inspector/node-inspector)
 *
 * ```bash
 * $ npm install
 * ```
 *
 * Add a file called `.env` to the root of the project with the following contents:
 * ```json
 * {
 *     "node": {
 *         "env": "dev"
 *     }
 * }
 * ```
 * You can now run the development server by running the following commands:
 * ```bash
 * $ npm start
 * ```
 *
 * - You can now visit [http://localhost:8081/](http://localhost:8081/) to view changes live.
 *
 * #### Serverside runtime
 * - Uses dependency injection from [Nodep](http://nodep.org)
 *
 * ### Running the test suite
 * #### Single Run:
 * ```bash
 * $ gulp test
 * ```
 * #### Continuous testing when files are changed:
 * ```bash
 * $ gulp autotest
 * ```
 * ### Generating README.md
 * ```bash
 * $ gulp docs
 * ```
 * ### Generating CHANGELOG.md
 * ```bash
 * $ gulp changelog
 * ```
 * ### Notes
 * - jshint is part of the test suite and should be kept clean
 * - Commits should have high test coverage
 * - Docs should be kept up to date
 * - Additions should come with documentation
 * - commit messages should follow [Angular conventional format](https://github.com/stevemao/conventional-changelog-angular/blob/master/convention.md)
 * @module contributing
 */
require('gulp-begin')(gulp, {
  // only include docs, test, and jshint
  exclude: [
    'html',
    'scripts',
    'styles',
    'build',
    'server',
    'demon',
    'dev',
    'autotest',
    'changelog'
  ],
  warnExclusions: true
});

gulp.task('default', ['dev']);
