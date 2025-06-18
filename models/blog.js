const {Schema, model} = require ('mongoose');
const { create } = require('./user');

const BlogSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    coverImageURL: {
        type: String,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
}, {timestamps: true});

// Virtual for comments
BlogSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'blog'
});

// Ensure virtuals are serialized
BlogSchema.set('toJSON', { virtuals: true });
BlogSchema.set('toObject', { virtuals: true });

// Pre-remove hook to delete associated comments
BlogSchema.pre('remove', async function(next) {
    const Comment = require('./comment');
    await Comment.deleteMany({ blog: this._id });
    next();
});

const Blog = model('Blog', BlogSchema);
module.exports = Blog;