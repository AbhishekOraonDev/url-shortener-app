import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/UserModel.js";


//------------------Configure Google Strategy for auth-------------------
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.CALLBACKURL}` || `http://localhost:3000/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
    try{
        // Check if the user exists in DB
        let user = await User.findOne({googleId: profile.id});

        if(!user) {
            // Create a new user
            user = await User.create({
                googleId: profile.id,
                displayName: profile.displayName,
                email: profile.emails[0].value,
                photo: profile.photos[0].value,
            });
        }

        return done(null, user);

    }catch(error){

        return done(error, null);
    }
})
);

// Serialize and deserialize user data.
passport.serializeUser((user, done) => {
    // console.log("Serialized user:", user);
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        // console.log("Deserialized user:", user);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});


export default passport;