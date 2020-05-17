const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const EmailUser = require('../views/emailuserschema.js');
const hbs = require('nodemailer-express-handlebars');
require('dotenv').config();
const express = require('express');
mongoose.connect("mongodb+srv://Atharva:Vandana@carsofficial-yewfn.mongodb.net/test?retryWrites=true&w=majority", {
	useNewUrlParser: true,
	useUnifiedTopology: true
});
mongoose.set('useFindAndModify', false);
module.exports = (app) => {
	app.use('/verifyemail/:random', express.static('./public'));
	app.use('/verification/:Email', express.static('./public'));
	app.get('/', (req, res) => {
		res.render('home');
	});
	app.post('/', (req, res) => {
		const {
			Email
		} = req.body;
		let errors = [];
		//Check required fields
		if (!Email) {
			errors.push({
				msg: 'Please fill in the email'
			});
		}
		if (errors.length > 0) {
			res.render('home', {
				errors, Email
			});
		} else {
			EmailUser.findOne({
				Email: req.body.Email
			}, function (err, data) {
				if (err) throw err
				if (data !== null) {
					if (data.IsVerified === 'true') {
						console.log('Already registered and verified user');
						req.flash('success_msg', 'Thank you for joining us again.Please continue.');
						res.redirect('/events/:' + data.Email);
					} else {
						//First delete the data in database
						EmailUser.deleteOne({
							Email: req.body.Email
						}, (err, res1) => {
							if (err) throw err;
							console.log('Unverified User Deleted');
							const RandomNumber = Math.random() * 100000000000000000;
							const IsVerified = 'false';
							const newEmailUser = new EmailUser({
								Email, IsVerified, RandomNumber
							});
							//Save User
							newEmailUser.save().then(user => {
								console.log('Unverified user saved');
							}).catch(err => console.log(err));


							async function main() {
								// create reusable transporter object using the default SMTP transport
								let transporter = nodemailer.createTransport({
									service: 'gmail',
									auth: {
										type: 'OAuth2',
										user: 'atharvamashalkar1821@gmail.com', // generated ethereal user
										clientId: process.env.VER_CLIENT_ID,
										clientSecret: process.env.VER_CLIENT_SECRET,
										refreshToken: process.env.VER_REFRESH_TOKEN,
										accessToken: process.env.VER_ACCESS_TOKEN
									}
								});
								transporter.use('compile', hbs({
									viewEngine: {
										extName: '.handlebars',
										partialsDir: './views',
										layoutsDir: './views',
										defaultLayout: 'verificationtemplate.handlebars',
									},
									viewPath: './views',
									extName: '.handlebars',
								}))
								// Send mail with defined transport object
								let info = await transporter.sendMail({
									from: '"Google Events" <atharvamashalkar1821@gmail.com>', // sender address
									to: newEmailUser.Email, // list of receivers
									subject: "Verification Mail", // Subject line
									text: "Hello world?", // plain text body
									template: 'verificationtemplate',
									context: {
										ranNumber: newEmailUser.RandomNumber,
									}
								});
								console.log("Verification Mail sent");
							}
							main().then(user => {
								req.flash('success_msg', 'We have sent you a verification mail please check your email');
								res.redirect('/verification/:' + newEmailUser.Email);
							}).catch(err => console.log('Message was not sent due to:' + err));
						});
					}
				} else {
					const RandomNumber = Math.random() * 100000000000000000;
					const IsVerified = 'false';
					const newEmailUser = new EmailUser({
						Email, IsVerified, RandomNumber
					});
					//Save User
					newEmailUser.save().then(user => {
						console.log('Unverified user saved');
					}).catch(err => console.log(err));

					async function main() {
						// create reusable transporter object using the default SMTP transport
						let transporter = nodemailer.createTransport({
							service: 'gmail',
							auth: {
								type: 'OAuth2',
								user: 'atharvamashalkar1821@gmail.com', // generated ethereal user
								clientId: process.env.VER_CLIENT_ID,
								clientSecret: process.env.VER_CLIENT_SECRET,
								refreshToken: process.env.VER_REFRESH_TOKEN,
								accessToken: process.env.VER_ACCESS_TOKEN
							}
						});
						transporter.use('compile', hbs({
							viewEngine: {
								extName: '.handlebars',
								partialsDir: './views',
								layoutsDir: './views',
								defaultLayout: 'verificationtemplate.handlebars',
							},
							viewPath: './views',
							extName: '.handlebars',
						}))
						// Send mail with defined transport object
						let info = await transporter.sendMail({
							from: '"Google Events" <atharvamashalkar1821@gmail.com>', // sender address
							to: newEmailUser.Email, // list of receivers
							subject: "Verification Mail", // Subject line
							text: "Hello world?", // plain text body
							template: 'verificationtemplate',
							context: {
								ranNumber: newEmailUser.RandomNumber,
							}
						});
						console.log("Verification Message sent");
					}
					main().then(user => {
						req.flash('success_msg', 'We have sent you a verification mail please check your email');
						res.redirect('/verification/:' + newEmailUser.Email);
					}).catch(err => console.log('Message was not sent due to:' + err));
				}
			});
		}
	})
	app.get('/verifyemail/:random', (req, res) => {
		EmailUser.findOne({
			RandomNumber: req.params.random.slice(1)
		}, function (err, data) {
			if (err) throw err
			else if (data != null) {
				data.IsVerified = 'true';
				EmailUser.updateOne({
					RandomNumber: req.params.random.slice(1)
				}, data, (err, data2) => {
					if (err) throw err;
					console.log(`${data.Email} has been verified and updated in database`);
					req.flash('success_msg', 'Thank you for verification.');
					res.redirect('/thankyou');
				});
			} else {
				req.flash('error_msg', 'Email verfication time limit exceed.Please try again');
				res.redirect('/');
			}
		});
	})
	app.get('/verification/:Email', (req, res) => {
		EmailUser.findOne({
			Email: req.params.Email.slice(1)
		}, function (err, data) {
			if (err) throw err
			res.render('verificationpage', {
				data: data
			})
		});
	})
	app.post('/events/:Email', (req, res) => {
		EmailUser.findOne({
			Email: req.params.Email.slice(1)
		}, function (err, data) {
			if (err) throw err
			if (data.IsVerified === 'true') {
				req.flash('success_msg', 'Thank you for verification.You can continue.');
				res.redirect('/events/:' + req.params.Email.slice(1));
			} else {
				EmailUser.deleteOne({
					Email: req.body.Email
				}, (err, res1) => {
					if (err) throw err;
					console.log('Unverified User Deleted due to proceeding unverified');
					req.flash('error_msg', 'Email was not verified.Please try again.');
					res.redirect('/');
				});
			}
		});
	})
	app.post('/notverified', (req, res) => {
		EmailUser.deleteOne({
			Email: req.body.Email
		}, (err, res1) => {
			if (err) throw err;
			console.log('Unverified User Deleted due time delay');
			req.flash('error_msg', 'Email verfication time limit exceed.Please try again');
			res.redirect('/');
		});
	})
	app.get('/thankyou', (req, res) => {
		res.render('thankyou');
	})
}