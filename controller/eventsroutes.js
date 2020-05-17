const nodemailer = require('nodemailer');
const fs = require('fs');
const readline = require('readline');
const {
	google
} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const hbs = require('nodemailer-express-handlebars');
const EmailUser = require('../views/emailuserschema.js');
const json = require('format-json');
require('dotenv').config();
const express = require('express');
module.exports = (app) => {
	app.use('/events/:Email', express.static('./public'));
	app.get('/events/:Email', (req, res) => {
		//Get credentials from local file
		fs.readFile('credentials.json', (err, content) => {
			if (err) return console.log('Error loading client secret file:', err);
			// Authorize a client with credentials, then call the Google Calendar API.
			authorize(JSON.parse(content));
		});
		//Use the credentials to pass them to get access tokens
		function authorize(credentials, callback) {
			const {
				client_secret, client_id, redirect_urls
			} = credentials.web;
			const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_urls[1]);
			return getAccessToken(oAuth2Client, callback);
		}
		//Declaring Email variable globally to access it in calendar route
		req.session.Email = req.params.Email.slice(1);
		//Get access token by asking the user to signin
		function getAccessToken(oAuth2Client, callback) {
			var authUrl = oAuth2Client.generateAuthUrl({
				access_type: 'offline',
				scope: SCOPES,
			});
			// console.log('Authorize this app by visiting this url:', authUrl);
			res.redirect(authUrl);
		}
	})
	app.get('/calendar', (req, res1) => {
		//Variables to be used in Email
		var mailEvent = [];
		//Get credentials from local file
		fs.readFile('credentials.json', (err, content) => {
			if (err) return console.log('Error loading client secret file:', err);
			// Authorize a client with credentials, then call the Google Calendar API.
			authorize(JSON.parse(content), listEvents);
		});
		//Pass the credentials 
		function authorize(credentials, callback) {
			const {
				client_secret, client_id, redirect_urls
			} = credentials.web;
			const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_urls[1]);
			return getAccessToken(oAuth2Client, callback);
		}
		//Use the access tokens to authorize with the api
		function getAccessToken(oAuth2Client, callback) {
			let code = req.query.code
			oAuth2Client.getToken(code, (err, token) => {
				if (err) return console.error('Error retrieving access token', err);
				oAuth2Client.setCredentials(token);
				callback(oAuth2Client);
			});
		}
		//Retrieve the required info from the user's calendar
		function listEvents(auth) {
			const calendar = google.calendar({
				version: 'v3',
				auth
			});
			calendar.events.list({
				calendarId: 'primary',
				timeMin: (new Date()).toISOString(),
				maxResults: 20,
				singleEvents: true,
				orderBy: 'startTime',
			}, (err, res) => {
				if (err) return console.log('The API returned an error: ' + err);
				const events = res.data.items;
				if (events.length) {
					events.map((event, i) => {
						let item = {
							"Date": event.start.date || event.start.dateTime,
							"Title": event.summary,
							"Description": event.description
						}
						mailEvent.push(item);
					});
					console.log('Events Stored in an array');
				} else {
					mailEvent = ["No upcoming Events"];
					console.log('No upcoming events found.');
				}
				let newmailEvent = json.plain(mailEvent);
				fs.writeFileSync('MyUpcomingEvents.json', newmailEvent, 'utf8');
				console.log('MyUpcomingEvents file written');

				//Mailing Events
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
							defaultLayout: 'welcome_template.handlebars',
						},
						viewPath: './views',
						extName: '.handlebars',
					}))
					// Send mail with defined transport object
					let info = await transporter.sendMail({
						from: '"Google Events" <atharvamashalkar1821@gmail.com>', // sender address
						to: req.session.Email, // list of receivers
						subject: "Your Upcoming Events", // Subject line
						text: "Hello world?", // plain text body
						attachments: [{
							filename:'Logo.png',
							path:'./Logo.png',
							cid:'Logo'
						},
						{
							filename:'facebook2x.png',
							path:'./facebook2x.png',
							cid:'facebook2x'
						},
						{
							filename:'illo_welcome_1.png',
							path:'./illo_welcome_1.png',
							cid:'illo_welcome_1'
						},
						{
							filename:'instagram2x.png',
							path:'./instagram2x.png',
							cid:'instagram2x'
						},
						{
							filename:'pinterest2x.png',
							path:'./pinterest2x.png',
							cid:'pinterest2x'
						},
						{
							filename:'twitter2x.png',
							path:'./twitter2x.png',
							cid:'twitter2x'
						}],
						template: 'welcome_template',
						context: {
							newmailEvent: newmailEvent,
						}
					});
					console.log("Events Mail sent");
				}
				main().then(user => {
					fs.unlink('MyUpcomingEvents.json', (err) => {
						if (err) throw err;
						console.log('MyUpcomingEvents file deleted');
					});
				}).catch(err => console.log('Message was not sent due to:' + err));
				req.flash('success_msg', 'We have sent you a mail containing your upcoming events.Please check your email');
				res1.redirect('/');
			});
		}
	})
}