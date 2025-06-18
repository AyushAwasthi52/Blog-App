const {Router} = require('express');
const multer  = require('multer');
const Blog = require('../models/blog');
const Comment = require('../models/comment');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const router = Router();

router.get('/add-blog', (req, res) => {
    res.render('blog', {
        user: req.user
    });
});

// Debug route to list all blogs
router.get('/debug', async (req, res) => {
    try {
        const blogs = await Blog.find({}).populate('createdBy');
        res.json({
            count: blogs.length,
            blogs: blogs
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to display individual blog post
router.get('/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate('createdBy')
            .populate({
                path: 'comments',
                populate: {
                    path: 'createdBy',
                    select: 'full_name'
                }
            });
            
        if (!blog) {
            return res.status(404).render('error', { 
                message: 'Blog not found',
                user: req.user 
            });
        }
        res.render('blog-detail', {
            blog: blog,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).render('error', { 
            message: 'Error loading blog',
            user: req.user 
        });
    }
});

// Route to delete a blog post
router.delete('/:id', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const blog = await Blog.findById(req.params.id).populate('createdBy');
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        console.log('Delete request:', {
            requestingUser: req.user._id.toString(),
            blogCreator: blog.createdBy._id.toString(),
            isOwner: req.user._id.toString() === blog.createdBy._id.toString()
        });

        // Check if user owns the blog
        if (req.user._id.toString() !== blog.createdBy._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this blog' });
        }

        await Blog.findByIdAndDelete(req.params.id);
        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ error: 'Failed to delete blog' });
    }
});

// Route to show edit blog form
router.get('/edit/:id', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const blog = await Blog.findById(req.params.id).populate('createdBy');
        if (!blog) {
            return res.status(404).render('error', { 
                message: 'Blog not found',
                user: req.user 
            });
        }

        // Check if user owns the blog
        if (req.user._id.toString() !== blog.createdBy._id.toString()) {
            return res.status(403).render('error', { 
                message: 'Not authorized to edit this blog',
                user: req.user 
            });
        }

        res.render('edit-blog', {
            blog: blog,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching blog for edit:', error);
        res.status(500).render('error', { 
            message: 'Error loading blog for editing',
            user: req.user 
        });
    }
});

// Route to update a blog post
router.post('/edit/:id', upload.single('coverImage'), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { title, body } = req.body;
        
        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }

        const blog = await Blog.findById(req.params.id).populate('createdBy');
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Check if user owns the blog
        if (req.user._id.toString() !== blog.createdBy._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to edit this blog' });
        }

        // Prepare update data
        const updateData = {
            title,
            body
        };

        // Handle new image upload
        if (req.file) {
            updateData.coverImageURL = `/uploads/${req.file.filename}`;
        }

        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        console.log('Blog updated successfully:', updatedBlog);
        return res.redirect(`/blog/${req.params.id}`);
    } catch (error) {
        console.error('Error updating blog:', error);
        return res.status(500).json({ error: 'Failed to update blog' });
    }
});

router.post('/', upload.single('coverImage'), async (req, res) => {
    try {
        const { title, body } = req.body;
        const coverImageURL = req.file ? `/uploads/${req.file.filename}` : null;
        
        console.log('Blog creation request:', { title, body, coverImageURL, user: req.user });
        
        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }

        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const newBlog = await Blog.create({
            title,
            body,
            coverImageURL,
            createdBy: req.user._id,
        });

        console.log('Blog created successfully:', newBlog);
        return res.redirect('/');
    } catch (error) {
        console.error('Error creating blog:', error);
        if (error.message === 'Only image files are allowed!') {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Failed to create blog' });
    }
});

// Route to add a comment
router.post('/:id/comment', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { content } = req.body;
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment content is required' });
        }

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        const comment = await Comment.create({
            content: content.trim(),
            blog: req.params.id,
            createdBy: req.user._id
        });

        // Populate the createdBy field for the response
        await comment.populate('createdBy', 'full_name');

        console.log('Comment created:', comment);
        res.redirect(`/blog/${req.params.id}`);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// Route to delete a comment
router.delete('/comment/:commentId', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const comment = await Comment.findById(req.params.commentId).populate('createdBy');
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Check if user owns the comment or the blog
        const blog = await Blog.findById(comment.blog);
        const isCommentOwner = comment.createdBy._id.toString() === req.user._id.toString();
        const isBlogOwner = blog && blog.createdBy.toString() === req.user._id.toString();

        if (!isCommentOwner && !isBlogOwner) {
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }

        await Comment.findByIdAndDelete(req.params.commentId);
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

module.exports = router;