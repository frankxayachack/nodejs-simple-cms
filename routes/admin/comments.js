const express = require('express');
const router = express.Router();
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const User = require('../../models/User');


router.all('/*' , (req, res, next) => {

    req.app.locals.layout = 'admin';
    next();

});

router.get('/', (req, res) => {
    
    Comment.find({}).populate('user').then(comments => {

        res.render('admin/comments', {comments: comments});

    });


});


router.post('/', (req, res) => {

    
    Post.findOne({_id: req.body.id}).then(post => {

        const newComment = new Comment({
            
            user: req.user.id,
            body: req.body.body

        });

        post.comments.push(newComment);

        post.save().then(savedPost => {

            newComment.save().then(savedComment => {

                req.flash('success_message', 'Your comment has been added to a post');

                res.redirect(`/post/${post.id}`);

            });
            
        });
        
    });

});

router.post('/search', (req, res) => {

    User.findOne({firstName: req.body.firstName}).then(user => {

        if(!user){

            req.flash('error_message', 'User does not existed');

            res.redirect('/admin/comments');
        }else{

            Comment.find({user: user}).populate('user').then(comments => {

                res.render('admin/comments', {comments: comments});

            })

        }

    });


});


router.delete('/:id', (req, res) => {

    Comment.findOne({_id: req.params.id}).then(comment => {

        Comment.remove({_id: req.params.id}).then(deletedItem => {

            Post.findOneAndUpdate({comments: req.params.id}, {$pull: {comments: req.params.id}}, (err, data) => {

                if(err) return err;

                res.redirect('/admin/comments');


            });


        });

        // comment.body = "This comment has been deleted";

        // comment.save(savedComment => {


        //     req.flash('success_message', 'The selected comment has been deleted');

        //     res.redirect('/admin/comments');

        // });

    });

});

router.post('/approve-comment', (req, res) => {

    Comment.findByIdAndUpdate(req.body.id, {$set: {approveComment: req.body.approveComment}}, (err, result) => {
        if(err) return err;

        res.send(result);
    });

});

module.exports = router;