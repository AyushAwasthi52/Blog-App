const JWT = require('jsonwebtoken');
const secret = '@uper@123';

function createTokenforUser(user){
    const payload = {
        _id: user._id,
        email: user.email,
        profileImage : user.profileImageURL,
        role : user.role,
    };
    const token = JWT.sign(payload, secret);

    return token;
}

function verifyToken(token){
    const payload = JWT.verify(token, secret);

    return payload;
}

module.exports = {
    createTokenforUser,
    verifyToken
};