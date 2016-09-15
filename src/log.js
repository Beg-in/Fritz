'use strict';

let winston = require('winston');

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
