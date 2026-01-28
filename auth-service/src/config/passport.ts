import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userProfile: true,
        accounts: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.AUTH_URL || "http://localhost:3001"}/google/callback`,
        scope: ["profile", "email"],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
      ) => {
        try {
          // Check if user already exists with this Google account
          let account = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: "google",
                providerAccountId: profile.id,
              },
            },
            include: {
              user: {
                include: {
                  userProfile: true,
                },
              },
            },
          });

          if (account) {
            // User exists, update the tokens
            await prisma.account.update({
              where: { id: account.id },
              data: {
                accessToken,
                refreshToken,
                updatedAt: new Date(),
              },
            });
            return done(null, account.user);
          }

          // Check if a user with this email already exists
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(
              new Error("No email found in Google profile"),
              undefined,
            );
          }

          let user = await prisma.user.findUnique({
            where: { email },
            include: {
              userProfile: true,
            },
          });

          if (user) {
            // User exists with this email, link the Google account
            await prisma.account.create({
              data: {
                id: crypto.randomUUID(),
                userId: user.id,
                type: "oauth",
                provider: "google",
                providerAccountId: profile.id,
                accessToken,
                refreshToken,
                scope: "profile email",
                tokenType: "Bearer",
                idToken: profile.id,
              },
            });

            // Update email verification since Google verified it
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                emailVerified: true,
                emailVerifiedAt: new Date(),
                image: profile.photos?.[0]?.value,
              },
              include: {
                userProfile: true,
              },
            });
          } else {
            // Create new user
            const userId = crypto.randomUUID();
            const displayName =
              profile.displayName ||
              profile.emails?.[0]?.value?.split("@")[0] ||
              "User";

            user = await prisma.user.create({
              data: {
                id: userId,
                email,
                emailVerified: true, // Google verifies emails
                emailVerifiedAt: new Date(),
                image: profile.photos?.[0]?.value,
                accounts: {
                  create: {
                    id: crypto.randomUUID(),
                    type: "oauth",
                    provider: "google",
                    providerAccountId: profile.id,
                    accessToken,
                    refreshToken,
                    scope: "profile email",
                    tokenType: "Bearer",
                    idToken: profile.id,
                  },
                },
                userProfile: {
                  create: {
                    id: crypto.randomUUID(),
                    phone: null,
                    address: null,
                    postalCode: null,
                    city: null,
                    province: null,
                    country: null,
                    role: "customer",
                    employeeType: null,
                  },
                },
              },
              include: {
                userProfile: true,
              },
            });
          }

          return done(null, user);
        } catch (error) {
          console.error("Error in Google OAuth callback:", error);
          return done(error as Error, undefined);
        }
      },
    ),
  );
} else {
  console.warn(
    "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.",
  );
}

export default passport;
