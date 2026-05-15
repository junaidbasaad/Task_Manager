import rateLimit from "express-rate-limit";

/** Login / register brute-force protection. */
export const authStrictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login or registration attempts, try again later." },
});
