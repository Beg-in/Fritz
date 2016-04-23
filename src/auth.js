'use strict';

const jwt = require('jsonwebtoken');
const scrypt = require('scrypt');

module.exports = function(_) {

    jwt._sign = jwt.sign;
    jwt.sign = (payload, secret, options) => new Promise(resolve =>
        jwt._sign(payload, secret, options, result => resolve(result))
    );
    jwt._verify = jwt.verify;
    jwt.verify = (token, key, options) => new Promise((resolve, reject) =>
        jwt._verify(token, key, options, (err, decoded) =>
            err ? reject(err) : resolve(decoded)
        )
    );

    return {
        scrypt: {
            lib: scrypt,
            hash: key => scrypt.params(0.1)
                    .then(params => scrypt.kdf(key, params))
                    .then(buffer => buffer.toString('base64')),
            verify: (kdf, key) => scrypt.verifyKdf(new Buffer(kdf, 'base64'), key)
        },
        jwt: jwt
    };
};
