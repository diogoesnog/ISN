/**
 * Group Post Schema
 * Contributors: Diogo Nogueira, Mateus Silva, Miguel R. Solans
 */

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Types.ObjectId,
        auto: true
    },
    text: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const postContentSchema = new mongoose.Schema({
    files: [String],
    text: String,
    url: String,
});

const groupPostSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Types.ObjectId,
        auto: true
    },
    groupId: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    content: postContentSchema,
    likes: {
        type: [String]
    },
    comments: {
        type: [commentSchema]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const GroupPost = mongoose.model('groupPosts', groupPostSchema, 'groupPosts');

module.exports = GroupPost;