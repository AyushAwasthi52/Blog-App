const {Router} = require('express');
const UserModel = require('../models/user');

const router = Router();

router.get('/signin', (req, res) => {
    return res.render('signin');
});

router.get('/signup', (req, res) => {
    return res.render('signup');
});

router.post('/signup', async (req, res) => {
    const {full_name, email, password} = req.body;
    UserModel.create({
        full_name,
        email,
        password,
    });
    return res.redirect('/');
});

router.post('/signin', async (req, res) => {
    try {
        const {email, password} = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const token = await UserModel.matchPassword(email, password);

        console.log('Token: ', token);
        return res.cookie("token", token).redirect('/');
    } catch (error) {
        console.error('Signin error:', error.message);
        return res.status(400).json({ error: error.message });
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.redirect('/');
});

module.exports = router;