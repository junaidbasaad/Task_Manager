import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { updateUserRoleSchema, validateBody } from "../validators/index.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: { users } });
  }),
);

router.patch(
  "/:id/role",
  validateBody(updateUserRoleSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.validated.body;

    if (id === req.user.id && role !== "ADMIN") {
      throw new AppError("You cannot remove your own admin role", 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: { user: updated } });
  }),
);

export default router;
