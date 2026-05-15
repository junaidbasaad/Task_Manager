import { prisma } from "../config/prisma.js";

export async function listActivity(req, res) {
  const user = req.user;
  const take = Math.min(Number(req.query.limit) || 50, 100);

  const where =
    user.role === "ADMIN"
      ? {}
      : {
          OR: [
            { userId: user.id },
            { project: { members: { some: { userId: user.id } } } },
          ],
        };

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      user: { select: { id: true, name: true, email: true, profileImage: true } },
      project: { select: { id: true, title: true } },
      task: { select: { id: true, title: true } },
    },
  });

  res.json({ success: true, data: { logs } });
}
