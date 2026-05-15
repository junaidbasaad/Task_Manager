import { prisma } from "../config/prisma.js";

export async function logActivity({ userId, projectId, taskId, action, details }) {
  try {
    await prisma.activityLog.create({
      data: { userId, projectId, taskId, action, details },
    });
  } catch (e) {
    console.error("activity log failed", e);
  }
}
