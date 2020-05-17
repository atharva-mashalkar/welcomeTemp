const express = require('express');
const app = express();
const signuppageroutes = require('./controller/signuppageroutes.js');
const eventsroutes = require('./controller/eventsroutes.js');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');


//set up view engine

app.set('view engine', 'ejs');

//static files

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({extended: false}));

//Express Session

app.use(session({
	  secret: 'secret',
	  resave: true,
	  saveUninitialized: true
	}));

//Connect flash

app.use(flash());

//Global Variables

app.use((req,res,next) => {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	next();
});

//fire signuppageroutes

signuppageroutes(app);

//fire eventsroutes

eventsroutes(app);

app.listen(process.env.PORT || 3000, () => {
	console.log('You are listening to Port 3000');
});