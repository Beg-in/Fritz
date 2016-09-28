'use strict';

let winston = require('winston');

/**
 * ## Log
 * Wrapper for [Winston](https://github.com/winstonjs/winston)
 * ### Logging
 * ```js
 * log('a message to log');
 * log.info('an info message to log');
 * log.warn('an warn message to log');
 * log.error('an error message to log');
 *
 * // set loggers for Winston
 * log.setLogger([
 *      {
 *          type: 'Console',
 *          colorize: true,
 *          level: 'debug'
 *      }
 * ])
 * ```
 * @namespace
 * @type {Function}
 * @module log
 */
module.exports = function(_) {
    let logger;
    const setLogger = transports => {
        logger = new (winston.Logger)({
            transports: _.map(transports, transport =>
                new (winston.transports[transport.type])(transport)
            )
        })
    };
    setLogger([
        {
            type: 'Console',
            colorize: true,
            level: 'debug'
        }
    ]);

    let log = function() {
        logger.debug.apply(logger, arguments);
    };
    log.info = function() {
        logger.info.apply(logger, arguments);
    };
    log.warn = function() {
        logger.warn.apply(logger, arguments);
    };
    log.error = function() {
        logger.error.apply(logger, arguments);
    };
    log.setLogger = setLogger;
    return log;
};
