import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as dashboard from "../controllers/dashboard.controller.js";
import * as activity from "../controllers/activity.controller.js";

const router = Router();

router.use(authenticate);

router.get("/stats", asyncHandler(dashboard.dashboardStats));
router.get("/activity", asyncHandler(activity.listActivity));

export default router;
