import { z } from "zod";
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as taskController from "../controllers/task.controller.js";
import {
  taskCreateSchema,
  taskListQuerySchema,
  taskUpdateSchema,
  validateBody,
  validateQuery,
} from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const memberStatusOnly = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
});

const router = Router();

router.use(authenticate);

function validateTaskUpdate(req, res, next) {
  if (req.user.role === "MEMBER") {
    return validateBody(memberStatusOnly)(req, res, next);
  }
  return validateBody(taskUpdateSchema)(req, res, next);
}

router.get("/", validateQuery(taskListQuerySchema), asyncHandler(taskController.listTasks));
router.get("/:id", asyncHandler(taskController.getTask));
router.post("/", validateBody(taskCreateSchema), asyncHandler(taskController.createTask));
router.patch("/:id", validateTaskUpdate, asyncHandler(taskController.updateTask));
router.delete("/:id", asyncHandler(taskController.deleteTask));

export default router;
