const { verify } = require('jsonwebtoken');
const {verifyToken} = require('../services/auth');

function checkforAuthenticationCookie (cookieName) {
    return (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName];
        if (!tokenCookieValue) return next();

        try{
            const payload = verifyToken(tokenCookieValue);
            req.user = payload;
        }
        catch(error) {};
        return next();
    }
}

module.exports = {
    checkforAuthenticationCookie
}