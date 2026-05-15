import { PrismaClient, UserRole, TaskPriority, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Alex Admin",
      email: "admin@example.com",
      password: passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: {},
    create: {
      name: "Morgan Member",
      email: "member@example.com",
      password: passwordHash,
      role: UserRole.MEMBER,
    },
  });

  const project = await prisma.project.create({
    data: {
      title: "Product Launch",
      description: "Coordinate launch tasks across teams.",
      createdBy: admin.id,
      members: {
        create: [
          { userId: admin.id },
          { userId: member.id },
        ],
      },
    },
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.task.createMany({
    data: [
      {
        title: "Draft release notes",
        description: "Summarize features for marketing.",
        projectId: project.id,
        assignedTo: member.id,
        createdBy: admin.id,
        priority: TaskPriority.HIGH,
        status: TaskStatus.DONE,
        dueDate: new Date(),
      },
      {
        title: "QA regression suite",
        description: "Run full regression before go-live.",
        projectId: project.id,
        assignedTo: member.id,
        createdBy: admin.id,
        priority: TaskPriority.URGENT,
        status: TaskStatus.IN_PROGRESS,
        dueDate: yesterday,
      },
      {
        title: "Update onboarding copy",
        description: "Align with new pricing page.",
        projectId: project.id,
        assignedTo: admin.id,
        createdBy: admin.id,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
      },
      {
        title: "Security review",
        description: "Third-party pen test follow-ups.",
        projectId: project.id,
        assignedTo: admin.id,
        createdBy: admin.id,
        priority: TaskPriority.LOW,
        status: TaskStatus.IN_REVIEW,
        dueDate: new Date(Date.now() + 86400000 * 3),
      },
    ],
  });

  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        projectId: project.id,
        action: "PROJECT_CREATED",
        details: `Created project "${project.title}"`,
      },
      {
        userId: admin.id,
        projectId: project.id,
        action: "MEMBER_ADDED",
        details: `Added ${member.email} to project`,
      },
    ],
  });

  console.log("Seed complete. Login: admin@example.com / member@example.com — password: Password123!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
