const express = require('express');
const router = express.Router();
const Post = require('../../models/Post');
const Category = require('../../models/Category');
const {isEmpty, uploadDir} = require('../../helpers/upload-helper');
const fs = require('fs');
const {userAuthenticated} = require('../../helpers/authentication');


router.all('/*' , (req, res, next) => {

    req.app.locals.layout = 'admin';
    next();

});

router.get('/', (req,res) => {

    Post.find({})
    
    .populate('category')
    .then(posts => {

        res.render('admin/posts/index', {posts: posts});

    }).catch(err => {
        console.log("Error: ", err);
    });


});

router.get('/my-posts', (req, res) => {

    Post.find({user: req.user.id})
    
    .populate('category')
    .then(posts => {

        res.render('admin/posts/mypost', {posts: posts});

    }).catch(err => {
        console.log("Error: ", err);
    });

});

router.get('/create', (req, res) => {

    Category.find({}).then(categories => {

        res.render('admin/posts/create', {categories: categories});

    });

    

});

router.post('/create', (req, res) => {

    let errors = [];

    if(!req.body.title) {
        errors.push({message: 'please add a title'});
    }

    if(!req.body.body) {
        errors.push({message: 'please add a description'});
    }

    if(errors.length > 0){
        res.render('admin/posts/create', {
            errors: errors
        });

    }else{

        let filename = "placeholder.png"

        if(!isEmpty(req.files.file)){
            
            let file  = req.files.file;
            filename = Date.now() + '-' + file.name;

            file.mv('./public/uploads/' + filename, (err) => {
                if(err) throw err;
            });

        }

        

        let allowComments = true;

        if(!req.body.allowComments){
            allowComments = false;
        }
        
        const newPost = new Post({

            user: req.user.id,
            category: req.body.category,
            title: req.body.title,
            status: req.body.status,
            allowComments: allowComments,
            body: req.body.body,
            file: filename

        });

        newPost.save().then(savedPost => {

            req.flash('success_message', `Post ${savedPost.title} was created successfully`)

            res.redirect('/admin/posts');
        }).catch(err => {
            console.log("Error: ", err);
        });

    }

    

});

router.get('/edit/:id', (req,res) => {
    Post.findOne({_id: req.params.id}).then(post => {

        Category.find({}).then(categories => {

            res.render('admin/posts/edit', {post: post, categories: categories});
    

        });

    });

});


router.put('/edit/:id', (req, res) => {
    Post.findOne({_id: req.params.id}).then(post => {
        if(req.body.allowComments){
            allowComments = true;
        }else{
            allowComments = false;
        }

        post.user = req.user.id,
        post.category = req.body.category;
        post.title = req.body.title;
        post.status = req.body.status;
        post.allowComments = allowComments;
        post.body = req.body.body;

        if(!isEmpty(req.files.file)){
            
            let file  = req.files.file;
            filename = Date.now() + '-' + file.name;
            post.file = filename;

            file.mv('./public/uploads/' + filename, (err) => {
                if(err) throw err;
            });

        }

        post.save().then(updatedPost => {
            
            req.flash('success_message', 'Post was successfully updated');

            res.redirect('/admin/posts/my-posts');
        });
    })
});

router.delete('/:id', (req,res) => {

    Post.findOne({_id: req.params.id})
        .populate('comments')
        .then(post => {

            if(post.comments.length > 0){

                post.comments.forEach(comment => {
                    comment.remove();
                });

            }

            fs.unlink(uploadDir + post.file, (err) => {
                
                post.remove().then(postRemoved => {

                    req.flash('success_message', 'Post was successfully deleted');

                    res.redirect('/admin/posts/my-posts');

                });

                

            });
            
        });

});



module.exports = router;
