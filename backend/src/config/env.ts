import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),

  mongoUri: process.env.MONGODB_URI || "",

  clientUrl:
    process.env.CLIENT_URL || "http://localhost:5176",

  sessionSecret:
    process.env.SESSION_SECRET || "change-me",

  googleClientId:
    process.env.GOOGLE_CLIENT_ID || "",

  googleClientSecret:
    process.env.GOOGLE_CLIENT_SECRET || "",

  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ||
    "http://localhost:5000/api/auth/google/callback",

  adminEmails:
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean),

  maxFileSizeMb:
    Number(process.env.MAX_FILE_SIZE_MB || 100),

  supabaseUrl:
    process.env.SUPABASE_URL || "",

  supabaseServiceRoleKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
};