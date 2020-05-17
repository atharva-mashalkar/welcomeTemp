const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var emailuserSchema = new Schema({
	Email : String,
	IsVerified : String,
	RandomNumber : String
});

var EmailUser = mongoose.model('EmailUser', emailuserSchema); 

module.exports = EmailUser;