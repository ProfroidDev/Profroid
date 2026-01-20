import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import auth from "./lib/auth";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
const allowedOrigins = (process.env.FRONTEND_URLS || "http://localhost:5173,http://localhost:3000")
  .split(",")
  .map(url => url.trim());

app.use(cors({
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
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Custom auth routes - mount at / since DigitalOcean routes /auth/* to this service
app.use("/", authRoutes);

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
  console.log(`   POST   /api/auth/register - Register new user`);
  console.log(`   POST   /api/auth/sign-in - Sign in user`);
  console.log(`   POST   /api/auth/sign-out - Sign out user`);
  console.log(`   GET    /api/auth/session - Get current session`);
  console.log(`   GET    /api/auth/user - Get current user`);
  console.log(`   PUT    /api/auth/user - Update user profile`);
  console.log(`   POST   /api/auth/change-password - Change password`);
  console.log(`   POST   /api/auth/verify-email - Verify email`);
  console.log(`   POST   /api/auth/resend-verification-email - Resend verification`);
});

export default app;
