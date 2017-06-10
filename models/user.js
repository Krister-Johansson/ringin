var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var SALT_WORK_FACTOR = 10;

var userSchema  = new Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // locations: [{
    //     _id: ObjectId,
    //     name: { type: String, required: true },
    //     tenant: { type: String, required: true },
    //     phonenumber: String,
    //     created_at: Date,
    //     updated_at: Date
    // }],
    permissions: [{
        _id: ObjectId,
        tenant: String,
        role: String,
        created_at: Date,
        updated_at: Date
    }],
    created_at: Date,
    updated_at: Date
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);