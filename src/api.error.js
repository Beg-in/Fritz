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

/**
 * ## Api Errors
 *
 * All `apiError` functions return a rejected Promise
 * with an value of type `ApiError`. These promises will
 * have a property called `throwable` that returns the
 * ApiError. If these promises are returned to a Fritz
 * route, they will result in a http response with the
 * appropriate error code and will be formatted by the
 * function at `apiError.handler`.
 *
 * ### Usage
 * ```js
 * // custom message and status code
 * apiError('a message to reject with', 200);
 *
 * // Bad Request (400)
 * apiError(); // default message
 * apiError('a message to reject with'); // custom message
 *
 * // respond with Internal Server Error (204)
 * apiError.fatal();
 * apiError.fatal('a message to log');
 * apiError(new Error());
 *
 * // All `apiError` functions accept a single parameter for the message
 * apiError.badRequest('a message to reject with');
 *
 * // Additional `apiError` error functions
 * apiError.noContent(); // No Content (204)
 * apiError.badRequest(); // Bad Request (400)
 * apiError.unauthorized(); // Unauthorized (401)
 * apiError.paymentRequired(); // Payment Required (402)
 * apiError.forbidden(); // Forbidden (403)
 * apiError.notFound(); // Not Found (404)
 * apiError.methodNotAllowed(); // Method Not Allowed (405)
 * apiError.conflict(); // Conflict (409)
 * apiError.unsupportedMediaType(); // Unsupported Media Type (415)
 * apiError.serverError(); // Internal Server Error (500)
 * ```
 * @namespace
 * @type {Function}
 * @module apiError
 */
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

    /**
     * Error handler middleware for Express
     * @function
     * @param {Object} req The request object
     * @param {Object} res The response object
     * @param {Function} next The next callback
     */
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

    /**
     * ApiError Error type
     * @type {Error}
     * @constant
     */
    error.throwable = ApiError;

    /**
     * List of possible error codes
     * @type {Object}
     * @constant
     */
    error.ERROR_CODES = ERROR_CODES;

    return error;
};
