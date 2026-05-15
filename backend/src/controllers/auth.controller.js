import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { signToken } from "../utils/jwt.js";
import { logActivity } from "../services/activity.service.js";

function sanitizeUser(user) {
  const rest = { ...user };
  delete rest.password;
  return rest;
}

export async function register(req, res) {
  const { name, email, password, role } = req.validated.body;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw new AppError("Email already registered", 409);
  }
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hash,
      role,
    },
  });
  await logActivity({
    userId: user.id,
    action: "USER_REGISTERED",
    details: `User ${user.email} registered`,
  });
  const token = signToken(user.id);
  res.status(201).json({
    success: true,
    data: { user: sanitizeUser(user), token },
  });
}

export async function login(req, res) {
  const { email, password } = req.validated.body;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("Invalid email or password", 401);
  }
  const token = signToken(user.id);
  res.json({
    success: true,
    data: { user: sanitizeUser(user), token },
  });
}

export async function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}

export async function updateProfile(req, res) {
  const { name, currentPassword, newPassword } = req.validated.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new AppError("User not found", 404);

  const data = {};
  if (name !== undefined) data.name = name;

  if (newPassword) {
    if (!currentPassword) {
      throw new AppError("Current password required to set new password", 400);
    }
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new AppError("Current password is incorrect", 400);
    data.password = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      createdAt: true,
    },
  });

  await logActivity({
    userId: user.id,
    action: "PROFILE_UPDATED",
    details: "Profile updated",
  });

  res.json({ success: true, data: { user: updated } });
}

export async function updateProfileImage(req, res) {
  if (!req.file) {
    throw new AppError("No image uploaded", 400);
  }
  const url = `/uploads/${req.file.filename}`;
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { profileImage: url },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      createdAt: true,
    },
  });
  await logActivity({
    userId: req.user.id,
    action: "PROFILE_IMAGE_UPDATED",
    details: url,
  });
  res.json({ success: true, data: { user: updated } });
}
