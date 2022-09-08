const siphash = require('siphash');
const config = require('./config');

module.exports = {
    createInvite: (unique) => {
        return siphash.hash_hex(config.secret, config.salt+unique) + unique;
    },
    constantTimeEquals: (a, b) => {
        if (a.length !== b.length) {
            return false;
        }
        let diff = 0;
        for (let i = 0; i < a.length; i++) {
            diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return diff === 0;
    },
    inviteIsValid: (combined) => {
        const unique = combined.slice(16);
        const checksum = combined.slice(0, 16);
        const recalc = siphash.hash_hex(config.secret, config.salt+unique);
        return module.exports.constantTimeEquals(recalc, checksum);
    },
};
