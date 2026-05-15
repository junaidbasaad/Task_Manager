import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const weakSecrets = new Set([
  "dev-only-secret-change-me",
  "change-this-to-a-long-random-secret-in-production",
  "secret",
  "jwt-secret",
]);

const raw = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().optional(),
    JWT_SECRET: z.string().optional(),
    JWT_EXPIRES_IN: z.string().default("7d"),
    CLIENT_URL: z.string().default("http://localhost:5173"),
    /** Comma-separated list; overrides single CLIENT_URL for CORS when set (production). */
    ALLOWED_ORIGINS: z.string().optional(),
    MAX_FILE_SIZE_MB: z.coerce.number().positive().default(2),
  })
  .parse(process.env);

const trustProxy = ["1", "true", "yes"].includes((process.env.TRUST_PROXY || "").toLowerCase());

const isProd = raw.NODE_ENV === "production";

if (isProd) {
  if (!raw.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required in production");
  }
  if (!raw.JWT_SECRET?.trim()) {
    throw new Error("JWT_SECRET is required in production");
  }
  if (raw.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
  if (weakSecrets.has(raw.JWT_SECRET.trim())) {
    throw new Error("JWT_SECRET must be changed from the example / default value in production");
  }
} else {
  if (!raw.DATABASE_URL?.trim()) {
    console.warn("Warning: DATABASE_URL is not set");
  }
  if (!raw.JWT_SECRET?.trim()) {
    console.warn("Warning: JWT_SECRET is not set — using development default");
  }
}

const allowedOrigins = (() => {
  const fromEnv = raw.ALLOWED_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromEnv?.length) return fromEnv;
  return [raw.CLIENT_URL.replace(/\/$/, "")];
})();

export const env = {
  nodeEnv: raw.NODE_ENV,
  port: raw.PORT,
  databaseUrl: raw.DATABASE_URL || "",
  jwtSecret: raw.JWT_SECRET || "dev-only-secret-change-me",
  jwtExpiresIn: raw.JWT_EXPIRES_IN,
  clientUrl: raw.CLIENT_URL.replace(/\/$/, ""),
  allowedOrigins,
  maxFileSizeMb: raw.MAX_FILE_SIZE_MB,
  trustProxy,
  isProd,
};
