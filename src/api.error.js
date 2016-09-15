'use strict';

const ERROR_CODES = {
    noContent: {
        code: 204,
        message: 'The server successfully processed the request and is not returning any content'
    },
    badRequest: {
        code: 400,
        message: 'The server cannot or will not process the request due to an apparent client error'
    },
    unauthorized: {
        code: 401,
        message: 'Authentication is required and has failed or has not yet been provided'
    },
    paymentRequired: {
        code: 402,
        message: 'This resource requires payment'
    },
    forbidden: {
        code: 403,
        message: 'The user might be logged in but does not have the necessary permissions for the resource'
    },
    notFound: {
        code: 404,
        message: 'The requested resource could not be found'
    },
    methodNotAllowed: {
        code: 405,
        message: 'A request method is not supported for the requested resource'
    },
    conflict: {
        code: 409,
        message: 'The request could not be processed because of conflict'
    },
    unsupportedMediaType: {
        code: 415,
        message: 'The request entity has a media type which the server or resource does not support'
    },
    serverError: {
        code: 500,
        message: 'An unexpected condition was encountered'
    }
};

module.exports = function(
    _,
    log
) {
    class ApiError extends Error {
        constructor(message, code) {
            if(message instanceof Error) {
                super(ERROR_CODES.serverError.message);
                this.stack = message.stack;
                this.code = 500;
            } else {
                if(!code) {
                    code = 400;
                }
                if(!message) {
                    message = _.find(ERROR_CODES, {code: code}).message;
                }
                super(message);
                this.code = code;
            }
            this.name = 'ApiError';
            if(this.code === 500) {
                log.error(this);
            }
        }
    }

    let error = (msg, code) => {
        let throwable = new ApiError(msg, code);
        let promise = Promise.reject(throwable);
        promise.throwable = throwable;
        return promise;
    };
    _.forEach(ERROR_CODES, (obj, key) =>
        error[key] = msg => error(msg || obj.message, obj.code)
    );
    error.fatal = msg => error(msg, 500);
    error.handler = function(req, res, next) {
        return (err) => {
            if(err instanceof Error) {
                if(err instanceof ApiError) {
                    res.status(err.code);
                } else {
                    res.status(500);
                    log.error(err);
                    err.message = ERROR_CODES.serverError.message;
                }
            } else if(err.status) {
                res.status(err.status);
                if(err.status === 500) {
                    log.error(err);
                }
            }
            res.json({
                error: err.message
            });
        }
    };
    error.throwable = ApiError;
    error.ERROR_CODES = ERROR_CODES;

    return error;
};
