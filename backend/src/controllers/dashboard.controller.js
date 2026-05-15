import { prisma } from "../config/prisma.js";

export async function dashboardStats(req, res) {
  const user = req.user;

  const taskBaseWhere = user.role === "ADMIN" ? {} : { assignedTo: user.id };

  const totalProjectsWhere =
    user.role === "ADMIN" ? {} : { members: { some: { userId: user.id } } };

  const [
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    byStatus,
    byPriority,
  ] = await prisma.$transaction([
    prisma.project.count({ where: totalProjectsWhere }),
    prisma.task.count({ where: taskBaseWhere }),
    prisma.task.count({ where: { ...taskBaseWhere, status: "DONE" } }),
    prisma.task.count({
      where: { ...taskBaseWhere, status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] } },
    }),
    prisma.task.count({
      where: {
        ...taskBaseWhere,
        dueDate: { lt: new Date() },
        status: { not: "DONE" },
      },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: taskBaseWhere,
      _count: true,
    }),
    prisma.task.groupBy({
      by: ["priority"],
      where: taskBaseWhere,
      _count: true,
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      statusDistribution: byStatus.map((r) => ({ status: r.status, count: r._count })),
      priorityDistribution: byPriority.map((r) => ({ priority: r.priority, count: r._count })),
    },
  });
}
