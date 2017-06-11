var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var SALT_WORK_FACTOR = 10;

var userSchema  = new Schema({
    company: { type: String, required: true, unique: true },
    tenant: { type: String, required: true, unique: true },
    sid: { type: String, required: true, unique: true },
    firstName: String,
    lasttName: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
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

module.exports = mongoose.model('User', userSchema);