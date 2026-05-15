import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as projectController from "../controllers/project.controller.js";
import {
  projectCreateSchema,
  projectMemberSchema,
  projectUpdateSchema,
  validateBody,
} from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(projectController.listProjects));
router.get("/:id", asyncHandler(projectController.getProject));
router.post("/", validateBody(projectCreateSchema), asyncHandler(projectController.createProject));
router.patch("/:id", validateBody(projectUpdateSchema), asyncHandler(projectController.updateProject));
router.delete("/:id", asyncHandler(projectController.deleteProject));
router.post("/:id/members", validateBody(projectMemberSchema), asyncHandler(projectController.addMember));
router.delete("/:id/members/:userId", asyncHandler(projectController.removeMember));

export default router;
