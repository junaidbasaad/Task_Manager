import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { logActivity } from "../services/activity.service.js";
import { assertProjectAccess } from "./project.controller.js";

function buildTaskWhere(user, query) {
  const { projectId, search, status, priority } = query;
  const and = [];

  if (user.role === "MEMBER") {
    and.push({ assignedTo: user.id });
  }

  if (projectId) {
    and.push({ projectId });
  }
  if (status) {
    and.push({ status });
  }
  if (priority) {
    and.push({ priority });
  }
  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  return and.length ? { AND: and } : {};
}

export async function listTasks(req, res) {
  const q = req.validated.query;
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 20;
  const sortBy = q.sortBy ?? "createdAt";
  const sortOrder = q.sortOrder ?? "desc";

  const where = buildTaskWhere(req.user, q);

  if (q.projectId) {
    await assertProjectAccess(req.user, q.projectId);
  } else if (req.user.role === "MEMBER") {
    // Members only see assigned tasks across their projects implicitly via assignedTo
  }

  const [total, tasks] = await prisma.$transaction([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        assignee: { select: { id: true, name: true, email: true, profileImage: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, title: true } },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      tasks,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    },
  });
}

export async function getTask(req, res) {
  const { id } = req.params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true, profileImage: true } },
      creator: { select: { id: true, name: true, email: true } },
      project: true,
    },
  });
  if (!task) throw new AppError("Task not found", 404);
  await assertProjectAccess(req.user, task.projectId);
  if (req.user.role === "MEMBER" && task.assignedTo !== req.user.id) {
    throw new AppError("Access denied", 403);
  }
  res.json({ success: true, data: { task } });
}

export async function createTask(req, res) {
  if (req.user.role !== "ADMIN") {
    throw new AppError("Only admins can create tasks", 403);
  }
  const { title, description, projectId, assignedTo, priority, status, dueDate } = req.validated.body;
  await assertProjectAccess(req.user, projectId);
  if (assignedTo) {
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: assignedTo },
    });
    if (!member) {
      throw new AppError("Assignee must be a project member", 400);
    }
  }
  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? null,
      projectId,
      assignedTo: assignedTo ?? null,
      priority: priority ?? "MEDIUM",
      status: status ?? "TODO",
      dueDate: dueDate ?? null,
      createdBy: req.user.id,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true, profileImage: true } },
      project: { select: { id: true, title: true } },
    },
  });
  await logActivity({
    userId: req.user.id,
    projectId,
    taskId: task.id,
    action: "TASK_CREATED",
    details: `Created task "${task.title}"`,
  });
  res.status(201).json({ success: true, data: { task } });
}

export async function updateTask(req, res) {
  const { id } = req.params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError("Task not found", 404);
  await assertProjectAccess(req.user, task.projectId);

  if (req.user.role === "MEMBER") {
    if (task.assignedTo !== req.user.id) {
      throw new AppError("You can only update tasks assigned to you", 403);
    }
    const allowed = req.validated.body;
    const keys = Object.keys(allowed).filter((k) => allowed[k] !== undefined);
    if (keys.length !== 1 || keys[0] !== "status") {
      throw new AppError("Members may only update task status", 400);
    }
    const updated = await prisma.task.update({
      where: { id },
      data: { status: allowed.status },
      include: {
        assignee: { select: { id: true, name: true, email: true, profileImage: true } },
        project: { select: { id: true, title: true } },
      },
    });
    await logActivity({
      userId: req.user.id,
      projectId: task.projectId,
      taskId: id,
      action: "TASK_STATUS_UPDATED",
      details: `Status -> ${allowed.status}`,
    });
    return res.json({ success: true, data: { task: updated } });
  }

  const { title, description, assignedTo, priority, status, dueDate } = req.validated.body;
  if (assignedTo !== undefined && assignedTo !== null) {
    const member = await prisma.projectMember.findFirst({
      where: { projectId: task.projectId, userId: assignedTo },
    });
    if (!member) {
      throw new AppError("Assignee must be a project member", 400);
    }
  }
  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(assignedTo !== undefined ? { assignedTo } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true, profileImage: true } },
      project: { select: { id: true, title: true } },
    },
  });
  await logActivity({
    userId: req.user.id,
    projectId: task.projectId,
    taskId: id,
    action: "TASK_UPDATED",
    details: `Updated task "${updated.title}"`,
  });
  res.json({ success: true, data: { task: updated } });
}

export async function deleteTask(req, res) {
  if (req.user.role !== "ADMIN") {
    throw new AppError("Only admins can delete tasks", 403);
  }
  const { id } = req.params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError("Task not found", 404);
  await assertProjectAccess(req.user, task.projectId);
  await prisma.task.delete({ where: { id } });
  await logActivity({
    userId: req.user.id,
    projectId: task.projectId,
    action: "TASK_DELETED",
    details: `Deleted task "${task.title}"`,
  });
  res.json({ success: true, data: { deleted: true } });
}
