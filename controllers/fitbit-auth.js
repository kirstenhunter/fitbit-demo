var env = process.env.NODE_ENV || 'production',
	config = require('../config')[env];

var mongoose = require('mongoose'),
	User = mongoose.model('User'),
	OAuth = require('oauth'),
	passport = require('passport'),
	FitbitStrategy = require('passport-fitbit-oauth2').FitbitOAuth2Strategy;

// Configure Passport session management to use the Fitbit user
// These de/serialize functions work for this hack but are not
// well suited for "real world" apps because you'd want to persist
// the user's session across multiple Node instances and app reboots
passport.serializeUser(function(user, done) {
	// console.log("serialize user", user);
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	// console.log("deserialize obj", obj);
	done(null, obj);
});

// Tell Passport to use the Fitbit Strategy
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
	}
);
