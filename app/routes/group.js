const express   = require('express');
const router    = express.Router();
const group     = require('../controllers/groups');
const checkAuth = require('../middleware/check-auth');
const groupPost = require('../controllers/groupPosts');
const axios     = require('axios');
const parseTag  = require('../utils/parseTag');
const parseTime = require('../utils/parseTime');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload = multer({
    dest: 'app/public/uploads'
});

/*********************************************************************
 * Group Basic Operations
 *********************************************************************/



/**
 * List public routes
 */
router.get('/public', checkAuth, (req, res) => {
    
    group.listAvailableGroups({audience: true}, {_id: 1, name: 1, description: 1})
        .then(result => res.jsonp(result))
        .catch(err => res.jsonp(err));
});

/**
 * Add user to a group
 */
router.put('/:id/add', checkAuth, (req, res) => {
    let users = req.body.users;

    group.creator(req.params.id)
        .then(data => {
            if(data.creator === req.decodedUser && !data.audience) {
                group.registerMembers(req.params.id, users)
                    .then(result => res.jsonp(result))
                    .catch(err => res.jsonp(err));

            } else if (result.audience) {
                group.registerMembers(req.params.id, users)
                    .then(result => res.jsonp(result))
                    .catch(err => res.jsonp(err));
            } else {
                res.jsonp({title: "No Permission", message: "You don't have enough permissions to add users"});
            }
        })
        .catch(err => res.jsonp(err));
});

/**
 * New Group
 */
router.post('/new', checkAuth, (req, res) => {

    let newGroup = {
        name: req.body.name,
        description: req.body.description,
        members: [req.decodedUser],
        creator: req.decodedUser,
        audience: req.body.audience === 'true'
    };

    axios.post(`${process.env.API_URL}/group/new`, newGroup, {
        headers: {
            Cookie: `userToken=${req.cookies.userToken}`
        }
    }).then(result => {
        console.log(result.data);
        res.redirect(`/group/${result.data._id}`);
    })
        .catch(err => res.redirect('/feed'));
});


/*********************************************************************
 * Post Operations
 *********************************************************************/
/**
 * Create a Group Post
 */
router.post('/:id/post', checkAuth, upload.array('files', 12), (req, res) => {
    let user = req.decodedUser;

    console.log(req.body.text);

    let uploadedFiles = req.files;
    let fileNames = [];


    uploadedFiles.forEach(file => {
        let fileUpload = path.join(__dirname, `../public/uploads/files/${file.originalname}`);

        fs.rename(file.path, fileUpload, err => console.log(err));

        fileNames.push(`/uploads/files/${file.originalname}`);
    });

    let newPost = {
        groupId: req.params.id,
        createdBy: user,
        content: {
            text: req.body.text,
            files: fileNames
        }
    };

    axios.post(`${process.env.API_URL}/group/${req.params.id}/post`, newPost, {
        headers: {
            Cookie: `userToken=${req.cookies.userToken}`
        }
    }).then(result => {
        res.redirect(`/group/${newPost.groupId}`);
    }).catch(err => res.redirect(`/group/${newPost.groupId}`));

});


/**
 * Change Form Settings
 */
router.post('/:id/update', checkAuth, (req, res) => {


    let info = req.body;
    let id = req.params.id;

    let members = parseTag.parse(info.members);

    let parsedUpdate = {
        audience: info.audience,
        members: members,
        description: info.description,
        name: info.name
    };

    axios.put(`${process.env.API_URL}/group/${id}/update`, parsedUpdate, {
        headers: {
            Cookie: `userToken=${req.cookies.userToken}`
        }
    }).then(result => res.redirect(`/group/${id}`))
        .catch(err => res.redirect(`/group/${id}`));

});

/**
 * Group Comments Routes
 */

/**
 * Get a Group Post Comments
 */
router.get('/post/:id/comments', checkAuth, (req, res) => {
    let post = req.params.id;

    groupPost.getComments(post)
        .then(result => res.jsonp(result))
        .catch(err => res.jsonp(err));

});
// Post
router.post('/post/:id/comment', checkAuth, (req, res) => {
    let postId = req.params.id;

    let comment = {
        text: req.body.text,
        createdBy: req.decodedUser
    };

    groupPost.addComment(postId, comment)
        .then(result => res.jsonp(result))
        .catch(err => res.jsonp(err));

});

/**
 * Get a Single Group
 * is used
 */
router.get('/:id', checkAuth, (req, res) => {
    // {"description":"DAW Workgroup","audience":false,"members":["mateussilva","miguelsolans"],"_id":"5e2f05f54140892ba0bfbf8a","name":"DAW","creator":"mateussilva","__v":0}
    const getGroupInfo = axios.get(`${process.env.API_URL}/group/${req.params.id}`, {
        headers: {
            Cookie: `userToken=${req.cookies.userToken}`
        }
    });
    const getGroupPosts = axios.get(`${process.env.API_URL}/group/${req.params.id}/posts`, {
        headers: {
            Cookie: `userToken=${req.cookies.userToken}`
        }
    });

    let loginUser= req.decodedUser;

    axios.all([ getGroupInfo, getGroupPosts])
        .then(axios.spread((...response) => {
            const groupInfo = response[0].data;
            const posts = response[1].data;

            let now = new Date();

            for (let i in posts) {
                let date = new Date(posts[i].createdAt);

                const timeyears = parseTime.timeYears(date, now);
                const timemonth = parseTime.timeMonth(date, now);
                const timeweeks = parseTime.timeWeeks(date, now);
                const timedays = parseTime.timeDays(date, now);
                const timehours = parseTime.timeHours(date, now);
                const timeminutes = parseTime.timeMinutes(date, now);
                if (timeyears > 0) {
                    posts[i].createdAt = '' + timeyears + ' year' + (timeyears === 1 ? "" : "s")
                } else if (timemonth > 0) {
                    posts[i].createdAt = '' + timemonth + ' month' + (timemonth === 1 ? "" : "s")
                } else if (timeweeks > 0) {
                    posts[i].createdAt = '' + timeweeks + ' week' + (timeweeks === 1 ? "" : "s")
                } else if (timedays > 0) {
                    posts[i].createdAt = '' + timedays + ' day' + (timedays === 1 ? "" : "s")
                } else if (timehours > 0) {
                    posts[i].createdAt = '' + timehours + ' hour' + (timehours === 1 ? "" : "s")
                } else if (timeminutes > 0) {
                    posts[i].createdAt = '' + timeminutes + ' minute' + (timeminutes === 1 ? "" : "s")
                } else {
                    posts[i].createdAt = "Right Now"
                }

            }

            res.render('group', {
                data: posts,
                group: groupInfo,
                loginUser: loginUser
            });

        }));
});


module.exports = router;