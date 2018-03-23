const express = require('express');
const router = express.Router();
const Post = require('../../models/Post');
const Category = require('../../models/Category');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

router.all('/*' , (req, res, next) => {

    req.app.locals.layout = 'home';
    next();

});

router.get('/', (req, res) => {

    const perPage = 5;
    const page = req.query.page || 1;


    Post.find({})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .then(posts => {

            Post.count().then(postCount => {

                Category.find({}).then(categories => {
                    res.render('home/index', {
                        
                        posts: posts, 
                        categories: categories,
                        current: parseInt(page),
                        pages: Math.ceil(postCount / perPage)
                    
                    });
                });

            });

        

    });

    
    
});

router.get('/about', (req, res) => {

    res.render('home/about');
});

// App Login

router.get('/login', (req, res) => {

    res.render('home/login');
});

passport.use(new localStrategy({usernameField: 'email' }, (email, password, done) => {

    User.findOne({email: email}).then(user => {

        if(!user) return done(null, false, {message: 'No user found'});

        bcrypt.compare(password, user.password, (err, matched) => {

            if(matched){
                done(null, user);
            }
            else{
                done(null, false, {message: 'Incorrect password'});
            }

        });

    });

}));

// PASSPORT

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});

// END

router.post('/login', (req, res, next) => {

    passport.authenticate('local', {

        successRedirect: '/admin',
        failureRedirect: '/login',
        failureFlash: true,


    })(req,res,next);
    
});

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

// App register

router.get('/register', (req, res) => {

    res.render('home/register');
});



router.post('/register', (req, res) => {

    let errors = [];

    if(!req.body.firstName) {
        errors.push({message: 'please add your first name'});
    }

    if(!req.body.lastName) {
        errors.push({message: 'please add your last name'});
    }

    if(!req.body.email) {
        errors.push({message: 'email cannot be blank'});
    }

    if(!req.body.password) {
        errors.push({message: 'password cannot be blank'});
    }

    if(!req.body.passwordConfirm) {
        errors.push({message: 'confirm password cannot be blank'});
    }

    if(req.body.password !== req.body.passwordConfirm){
        errors.push({message: "Password fields must be the same"})
    }

    if(errors.length > 0){
        res.render('home/register', {
            errors: errors,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email
        });

    }else{

        User.findOne({email: req.body.email}).then(user => {

            if(user){
                
                
                req.flash('error_message', 'This email existed! please login');

                res.redirect('/login');

            }else{

                const newUser = new User({

                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: req.body.password
            
                });
        
                bcrypt.genSalt(10, function(err, salt) {
        
                    bcrypt.hash(newUser.password, salt, function(err, hash) {
                        // Store hash in your password DB.    
                        newUser.password = hash;
        
        
                        newUser.save().then(savedUser => {
        
                            req.flash('success_message', 'You are now registered, please login');
        
                            res.redirect('/login');
                        });
                    });
        
                });
                
            }

        });

        

        
    

    }

    


});

router.get('/post/:slug', (req, res) => {
   
    Post.findOne({slug: req.params.slug})
        .populate('user')
        .populate({path: 'comments', populate: {path: 'user', model: 'users'}})
        .then(post => {
            Category.find({}).then(categories => {
                res.render('home/post', {post: post, categories: categories});

            });
        });

});

module.exports = router;