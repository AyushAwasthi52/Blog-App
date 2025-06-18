const {createHmac, randomBytes} = require('crypto');
const {Schema, model} = require ('mongoose');
const {createTokenforUser} = require('../services/auth')

const UserSchema = new Schema({
    full_name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    salt: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    profileImageURL: {
        type: String,
        default: '../public/images/UserImage.avif',
    },
    role: {
        type: String,
        enum: ["ADMIN", "USER"],
        default: "USER",
    }
}, {timestamps: true});

UserSchema.pre("save", function (next){
    const User = this;
    if (!User.isModified('password')) return;
    const salt = randomBytes(16).toString();
    const hashedPassword = createHmac('sha256', salt).update(User.password).digest('hex'); 
    this.salt = salt;
    this.password = hashedPassword;

    next();
});

UserSchema.static('matchPassword', async function(email, password){
    try {
        const user = await this.findOne({email});
        if (!user) throw new Error('User does not exist');

        const salt = user.salt;
        if (!salt) throw new Error('User salt not found');

        const provided = createHmac('sha256', salt).update(password).digest('hex');

        if (provided !== user.password) throw new Error('Wrong Password');

        const token = createTokenforUser(user);
        return token;
    } catch (error) {
        throw error;
    }
});

const UserModel = model('Users', UserSchema);

module.exports = UserModel;