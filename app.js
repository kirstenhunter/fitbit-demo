var env = process.env.NODE_ENV || 'production',
	config = require('./config')[env];

var express = require('express'),
	http = require('http'),
	path = require('path'),
	OAuth = require('oauth'),
	passport = require('passport'),
	mongoose = require('mongoose'),
	FitbitStrategy = require('passport-fitbit-oauth2').FitbitOAuth2Strategy;

var app = express();

// All environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('TODO Random String: Fitbit is awesome!'));
app.use(express.session());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


var fitbitStrategy = new FitbitStrategy({
  clientID: config.fitbitClientKey,
  clientSecret: config.fitbitClientSecret,
  scope: ['activity','heartrate','location','profile'],
  callbackURL: "http://fitbitpluralsight-53387.onmodulus.net/auth/fitbit/callback"
}, function(accessToken, refreshToken, profile, done) {
console.log ("In the place now");
User.findOrCreate(
			{ encodedId: profile.id },
			{
				encodedId: profile.id,
				accessToken: accessToken,
				accessSecret: refreshToken,
				timezoneOffset: profile._json.user.offsetFromUTCMillis
			},
			{ upsert: true },
			function(err, numberAffected) {
				if (err) console.error(err);
				console.log('User updated ' + numberAffected + ' records.');
			}
		);

		// Create an OAuth 1.0a client to make a request to the Fitbit API
		var oauth = new OAuth.OAuth(
			'https://api.fitbit.com/oauth/request_token',
			'https://api.fitbit.com/oauth/access_token',
			config.fitbitClientKey,
			config.fitbitClientSecret,
			'1.0',
			null,
			'HMAC-SHA1'
		);

		// Subscribe this application to updates from the user's data
		oauth.post(
			'https://api.fitbit.com/1/user/-/apiSubscriptions/' + profile.id + '-all.json',
			token,
			tokenSecret,
			null,
			null,
			function (err, data, res){
				if (err) console.error(err);
				console.log("Subscription creation attempt results:", data);
				return done(null, profile);
			}
		);

});
passport.use(fitbitStrategy);

// Development Environment
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

// Connect to database and initialize model
mongoose.connect(config.db);
require('./models/user');

// Initialize controllers
var IndexController = require('./controllers/index'),
	FitbitAuthController = require('./controllers/fitbit-auth'),
	FitbitApiController = require('./controllers/fitbit-api'),
	TwilioApiController = require('./controllers/twilio-api');
var fitbitAuthenticate = passport.authenticate('fitbit', {
  successRedirect: '/auth/fitbit/success',
  failureRedirect: '/auth/fitbit/failure'
});

// Define routes
// Index and Notification routes
app.get('/', IndexController.index);
app.get('/phone', IndexController.showUser);
app.post('/phone', IndexController.saveUser);
app.post('/notifications', FitbitApiController.notificationsReceived);
// OAuth routes
app.get('/auth/fitbit', fitbitAuthenticate);
app.get('/auth/fitbit/callback', fitbitAuthenticate);

app.get('/auth/fitbit/success', function(req, res, next) {
  res.send(req.user);
});

// Start the server
http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
