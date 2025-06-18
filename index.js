const express = require('express');
const path = require('path');
const router = require('./routes/user');
const routerb = require('./routes/blog');
const mongoose = require('mongoose');
const cookieparser = require('cookie-parser');
const {checkforAuthenticationCookie} = require('./middleware/authentication');
const Blog = require('./models/blog');

const app = express();
const PORT = 8001;

app.use(express.urlencoded({extended: false}));
app.use(cookieparser());
app.use(checkforAuthenticationCookie('token'));
app.use(express.static(path.resolve('./public')));

mongoose.connect('mongodb://127.0.0.1:27017/blog-data').then((e) => console.log('Mongoose Connected'));

app.set("view engine", "ejs");
app.set("views", path.resolve('./views'));

app.get('/', async (req, res) => {
    try {
        console.log('Fetching blogs from database...');
        const allBlogs = await Blog.find({})
            .populate('createdBy')
            .populate('comments');
        console.log('Blogs found:', allBlogs.length);
        console.log('Blogs data:', allBlogs);
        
        res.render('home', {
            user: req.user,
            blogs: allBlogs
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.render('home', {
            user: req.user,
            blogs: []
        });
    }
});

app.use('/user', router);
app.use('/blog', routerb);

app.listen(PORT, () => console.log(`Server started at PORT: ${PORT}\nvisit http://localhost:${PORT}/user/signin to view the content`));