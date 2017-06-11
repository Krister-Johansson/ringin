var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var groupSchema  = new Schema({
    userId: { type: ObjectId, required: true },
    name: { type: String, required: true },
    sid: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    created_at: Date,
    updated_at: Date
});

module.exports = mongoose.model('Group', groupSchema);