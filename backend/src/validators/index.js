import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(128).optional(),
});

export const projectCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const projectMemberSchema = z.object({
  userId: z.string().uuid(),
});

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional().nullable(),
  projectId: z.string().uuid(),
  assignedTo: z
    .preprocess((v) => (v === "" ? null : v), z.union([z.string().uuid(), z.null()]).optional())
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  dueDate: z.coerce.date().optional().nullable(),
});

export const taskUpdateSchema = taskCreateSchema.partial().omit({ projectId: true });

export const taskListQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "dueDate", "title", "priority", "status"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details: parsed.error.flatten(),
      });
    }
    req.validated = { ...(req.validated || {}), body: parsed.data };
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        details: parsed.error.flatten(),
      });
    }
    req.validated = { ...(req.validated || {}), query: parsed.data };
    next();
  };
}
