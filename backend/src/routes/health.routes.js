import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "team-task-manager-api",
    uptime: process.uptime(),
    env: process.env.NODE_ENV || "development",
  });
});

router.get(
  "/ready",
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ success: true, ready: true, database: "up" });
    } catch {
      res.status(503).json({ success: false, ready: false, database: "down" });
    }
  }),
);

export default router;
