import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User";
import { env } from "./env";

// --------------------------------------------------
// Admin emails
// --------------------------------------------------

const adminEmails = env.adminEmails.map((email) =>
  email.trim().toLowerCase()
);

// --------------------------------------------------
// Google OAuth Strategy
// --------------------------------------------------

passport.use(
  new GoogleStrategy(
    {
      clientID: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackURL: env.googleCallbackUrl,
    },

    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleId = profile.id;

        const email =
          profile.emails?.[0]?.value?.toLowerCase().trim() || "";

        const name =
          profile.displayName ||
          `${profile.name?.givenName || ""} ${
            profile.name?.familyName || ""
          }`.trim();

        const avatar = profile.photos?.[0]?.value;

        if (!email) {
          return done(
            new Error("Google account email not available")
          );
        }

        console.log("Google login email:", email);
        console.log("Admin emails:", adminEmails);

        // --------------------------------------------------
        // Find existing user
        // --------------------------------------------------

        let user = await User.findOne({ googleId });

        // --------------------------------------------------
        // Create new user
        // --------------------------------------------------

        if (!user) {
          const role = adminEmails.includes(email)
            ? "admin"
            : "viewer";

          user = await User.create({
            googleId,
            email,
            name,
            avatar,
            role,
          });

          console.log("New user created");
          console.log("Role:", role);
        }

        // --------------------------------------------------
        // Update existing user
        // --------------------------------------------------

        else {
          user.email = email;
          user.name = name;
          user.avatar = avatar;

          // Admin status is controlled by the server.
          if (adminEmails.includes(email)) {
            user.role = "admin";
          } else if (user.role !== "admin") {
            user.role = "viewer";
          }

          await user.save();

          console.log("Existing user role:", user.role);
        }

        return done(null, user);
      } catch (error) {
        console.error("Google authentication error:", error);

        return done(error as Error);
      }
    }
  )
);

// --------------------------------------------------
// Session serialization
// --------------------------------------------------

passport.serializeUser((user: any, done) => {
  done(null, user._id.toString());
});

// --------------------------------------------------
// Session deserialization
// --------------------------------------------------

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
});

export default passport;