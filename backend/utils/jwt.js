import jwt from 'jsonwebtoken';

export function sign(payload, secret, options) {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, secret, options, (err, token) => {
            if (err)
                reject(err);
            else
                resolve(token);
        });
    });
};

export function verify(token, secret, options) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, options, (err, decoded) => {
            if (err)
                reject(err);
            else
                resolve(decoded);
        });
    });
};
