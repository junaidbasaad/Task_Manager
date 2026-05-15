import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  validateBody,
} from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";
import { authStrictLimiter } from "../middleware/rateLimiters.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

const router = Router();

router.post("/register", authStrictLimiter, validateBody(registerSchema), asyncHandler(authController.register));
router.post("/login", authStrictLimiter, validateBody(loginSchema), asyncHandler(authController.login));
router.get("/me", authenticate, asyncHandler(authController.me));
router.patch("/profile", authenticate, validateBody(updateProfileSchema), asyncHandler(authController.updateProfile));
router.post(
  "/profile/image",
  authenticate,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  asyncHandler(authController.updateProfileImage),
);

export default router;
