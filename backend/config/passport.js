const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const username = profile.displayName;
        const avatar = profile.photos?.[0]?.value;

        // 1. Look up by googleId first — already linked account
        let user = await User.findOne({ googleId });
        if (user) {
          return done(null, user);
        }

        // 2. Look up by email — link Google to existing email/password account
        user = await User.findOne({ email });
        if (user) {
          user.googleId = googleId;
          if (!user.avatar) user.avatar = avatar;
          await user.save();
          return done(null, user);
        }

        // 3. Brand-new user via Google — create account (no password)
        user = new User({
          email,
          googleId,
          username,
          avatar,
          password: null,
        });
        await user.save();
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// We use stateless JWT — no sessions needed for passport serialize
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
