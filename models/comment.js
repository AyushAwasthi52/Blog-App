const {Schema, model} = require('mongoose');

const CommentSchema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    blog: {
        type: Schema.Types.ObjectId,
        ref: 'Blog',
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    }
}, {timestamps: true});

const Comment = model('Comment', CommentSchema);
module.exports = Comment; 