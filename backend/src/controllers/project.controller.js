import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { logActivity } from "../services/activity.service.js";

async function assertProjectAccess(user, projectId) {
  if (user.role === "ADMIN") {
    const p = await prisma.project.findUnique({ where: { id: projectId } });
    if (!p) throw new AppError("Project not found", 404);
    return p;
  }
  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId: user.id },
    include: { project: true },
  });
  if (!membership) throw new AppError("Project not found or access denied", 404);
  return membership.project;
}

export async function listProjects(req, res) {
  const user = req.user;
  let projects;
  if (user.role === "ADMIN") {
    projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { tasks: true, members: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      },
    });
  } else {
    projects = await prisma.project.findMany({
      where: { members: { some: { userId: user.id } } },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { tasks: true, members: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      },
    });
  }
  res.json({ success: true, data: { projects } });
}

export async function getProject(req, res) {
  const { id } = req.params;
  await assertProjectAccess(req.user, id);
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true, profileImage: true } } } },
      _count: { select: { tasks: true } },
    },
  });
  res.json({ success: true, data: { project } });
}

export async function createProject(req, res) {
  if (req.user.role !== "ADMIN") {
    throw new AppError("Only admins can create projects", 403);
  }
  const { title, description } = req.validated.body;
  const project = await prisma.project.create({
    data: {
      title,
      description: description ?? null,
      createdBy: req.user.id,
      members: { create: { userId: req.user.id } },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    },
  });
  await logActivity({
    userId: req.user.id,
    projectId: project.id,
    action: "PROJECT_CREATED",
    details: `Created project "${project.title}"`,
  });
  res.status(201).json({ success: true, data: { project } });
}

export async function updateProject(req, res) {
  if (req.user.role !== "ADMIN") {
    throw new AppError("Only admins can update projects", 403);
  }
  const { id } = req.params;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) throw new AppError("Project not found", 404);
  const { title, description } = req.validated.body;
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    },
  });
  await logActivity({
    userId: req.user.id,
    projectId: id,
    action: "PROJECT_UPDATED",
    details: `Updated project "${project.title}"`,
  });
  res.json({ success: true, data: { project } });
}

export async function deleteProject(req, res) {
  if (req.user.role !== "ADMIN") {
    throw new AppError("Only admins can delete projects", 403);
  }
  const { id } = req.params;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) throw new AppError("Project not found", 404);
  await prisma.project.delete({ where: { id } });
  await logActivity({
    userId: req.user.id,
    action: "PROJECT_DELETED",
    details: `Deleted project "${existing.title}"`,
  });
  res.json({ success: true, data: { deleted: true } });
}

export async function addMember(req, res) {
  if (req.user.role !== "ADMIN") {
    throw new AppError("Only admins can manage members", 403);
  }
  const { id } = req.params;
  const { userId } = req.validated.body;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new AppError("Project not found", 404);
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new AppError("User not found", 404);
  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId, projectId: id } },
    create: { userId, projectId: id },
    update: {},
  });
  await logActivity({
    userId: req.user.id,
    projectId: id,
    action: "MEMBER_ADDED",
    details: `Added ${target.email} to project`,
  });
  const members = await prisma.projectMember.findMany({
    where: { projectId: id },
    include: { user: { select: { id: true, name: true, email: true, role: true, profileImage: true } } },
  });
  res.status(201).json({ success: true, data: { members } });
}

export async function removeMember(req, res) {
  if (req.user.role !== "ADMIN") {
    throw new AppError("Only admins can manage members", 403);
  }
  const { id, userId } = req.params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new AppError("Project not found", 404);
  if (userId === project.createdBy) {
    throw new AppError("Cannot remove project owner from members", 400);
  }
  await prisma.projectMember.deleteMany({ where: { projectId: id, userId } });
  await logActivity({
    userId: req.user.id,
    projectId: id,
    action: "MEMBER_REMOVED",
    details: `Removed user ${userId} from project`,
  });
  res.json({ success: true, data: { removed: true } });
}

export { assertProjectAccess };
