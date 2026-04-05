import { prisma } from "@/lib/db";
import { ActivityAction, Prisma } from "@prisma/client";

interface LogActivityOptions {
  treeId: string;
  userId: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

export async function logActivity(opts: LogActivityOptions) {
  try {
    await prisma.activityLog.create({ data: opts });
  } catch (err) {
    // Activity logging should never break main flows
    console.error("Failed to write activity log:", err);
  }
}

export async function getActivityLogs(
  treeId: string,
  cursor?: string,
  limit = 50
) {
  return prisma.activityLog.findMany({
    where: { treeId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    include: {
      user: { select: { id: true, name: true, image: true, email: true } },
    },
  });
}
