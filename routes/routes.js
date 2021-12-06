const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const fs = require('fs');
var passport = require('passport');
const maxSize = 4 * 1024 * 1024; // for 4MB

var storage = multer.diskStorage({
    destination: function (req, file, cd) {
        cd(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now + "_" + file.originalname);
    },
    limits: { fileSize: maxSize }
});

var upload = multer({
    storage: storage
}).single("image");

router.post('/', upload, (req, res) => {
    const user = new User({
        name: req.body.name,
        image: req.file.filename,
    });
    user.save((err) => {
        if (err) {
            res.json({ message: err.message, type: "danger" });
        } else {
            req.session.message = {
                type: "success",
                message: "Image added successfully",
            };
        }
        res.redirect("/index");
    });
});


router.get("/index", (req, res) => {
    User.find().exec((err, users) => {
        if (err) {
            res.json({ message: err.message });
        } else {
            res.render("index", {
                title: "Home Page",
                users: users,
            });
        }
    });
});

router.get('/edit/:id', (req, res) => {
    let id = req.params.id;
    User.findById(id, (err, user) => {
        if (err) {
            res.redirect('/index');
        } else {
            if (user == null) {
                res.redirect('/index');
            } else {
                res.render("edit_users", {
                    title: "Edit User",
                    user: user,
                });
            }
        }
    });
});

router.post('/update/:id', upload, (req, res) => {
    let id = req.params.id;
    let new_image = '';

    if (req.file) {
        new_image = req.file.filename;
        try {
            fs.unlinkSync("./uploads/" + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    User.findByIdAndUpdate(id, {
        name: req.body.name,
        image: new_image,
    }, (err, result) => {
        if (err) {
            res.json({ message: err.message, type: 'danger' });
        } else {
            req.session.message = {
                type: 'success',
                message: 'Image Updated successfully!'
            };
            res.redirect('/index');
        }
    })
});

router.get('/delete/:id', (req, res) => {
    let id = req.params.id;
    User.findByIdAndRemove(id, (err, result) => {
        if (result.image != '') {
            try {
                fs.unlinkSync('./uploads/' + result.image);
            } catch (err) {
                console.log(err);
            }
        }

        if (err) {
            res.json({ message: err.message });
        } else {
            req.session.message = {
                type: 'success',
                message: 'Image Deleted successfully'
            };
            res.redirect("/index");
        }
    });
});

router.get('/', function (req, res) {
    res.render('login', { user: req.user, title: "Nodejs Twitter Login" });
});

router.get('/twitter/login', passport.authenticate('twitter'));

router.get('/twitter/callback', passport.authenticate('twitter', {
    failureRedirect: '/'
}),
    function (req, res) {
        res.redirect('/index')
    });

router.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});


module.exports = router;