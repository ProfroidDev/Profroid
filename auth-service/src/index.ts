import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import passport from "./config/passport.js";
import auth from "./lib/auth";
import authRoutes from "./routes/auth.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
const allowedOrigins = (
  process.env.FRONTEND_URLS || "http://localhost:5173,http://localhost:3000"
)
  .split(",")
  .map((url) => url.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes - mount at /auth and /api/auth for compatibility
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

// Notification routes
app.use("/api/notifications", notificationsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, req: Request, res: Response) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Auth Service running on http://localhost:${port}`);
  console.log(`📝 API Documentation:`);
  console.log(`   POST   /auth/register - Register new user`);
  console.log(`   POST   /auth/sign-in - Sign in user`);
  console.log(`   POST   /auth/sign-out - Sign out user`);
  console.log(`   GET    /auth/user - Get current user`);
  console.log(`   PUT    /auth/user - Update user profile`);
  console.log(`   POST   /auth/change-password - Change password`);
  console.log(`   POST   /auth/verify-email/:token - Verify email`);
  console.log(`   POST   /auth/resend-verification - Resend verification`);
  console.log(`   GET    /auth/google - Initiate Google OAuth`);
  console.log(`   GET    /auth/google/callback - Google OAuth callback`);
  console.log(`   (Also available at /api/auth/* for backward compatibility)`);
});

export default app;
