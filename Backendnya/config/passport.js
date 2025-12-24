// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Serialize user untuk session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user dari session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth callback triggered');
        console.log('Profile:', profile.displayName, profile.emails[0].value);

        // Cek apakah user sudah ada di database
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User sudah ada, login
          console.log('Existing user found:', user.email);
          return done(null, user);
        }

        // User belum ada, buat baru
        console.log('Creating new user from Google profile');
        
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          profilePicture: profile.photos[0]?.value || null,
          // Password tidak diperlukan untuk Google OAuth
          password: 'google-oauth-no-password',
        });

        console.log('New user created:', user.email);
        done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;
