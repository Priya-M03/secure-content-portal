import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import passport from "./config/passport";
import mongoose from "mongoose";

import { env } from "./config/env";
import authRoutes from "./routes/auth";
import contentRoutes from "./routes/content";

const app = express();
app.set("trust proxy", 1);

// --------------------------------------------------
// Security
// --------------------------------------------------

app.use(helmet());

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

// --------------------------------------------------
// Body parsing
// --------------------------------------------------

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// --------------------------------------------------
// Session
// --------------------------------------------------

const isProduction = process.env.NODE_ENV === "production";

app.use(
  session({
    secret: env.sessionSecret,

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      secure: isProduction,

      sameSite: isProduction ? "none" : "lax",

      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

// --------------------------------------------------
// Passport
// --------------------------------------------------

app.use(passport.initialize());
app.use(passport.session());

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

// --------------------------------------------------
// Routes
// --------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);

// --------------------------------------------------
// Error handler
// --------------------------------------------------

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Server error:", err);

    res.status(500).json({
      message: "Internal server error",
    });
  }
);

// --------------------------------------------------
// MongoDB + Server
// --------------------------------------------------

mongoose
  .connect(env.mongoUri)
  .then(() => {
    app.listen(env.port, () => {
      console.log(`API running on ${env.port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });