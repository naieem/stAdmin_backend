var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var userSchema = new Schema({
    _id: String,
    name: String,
    username: { type: String, required: true },
    password: { type: String, required: true },
    admin: Boolean,
    location: String,
    meta: {
        age: Number,
        website: String
    },
    tags: Array,
    created_at: Date,
    updated_at: Date
});

var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;