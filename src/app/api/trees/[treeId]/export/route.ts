import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exportSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import {
  apiError,
  AuthError,
  requireTree,
  requireTreeAccess,
} from "@/lib/permissions";

type Params = { params: Promise<{ treeId: string }> };

// POST /api/trees/[treeId]/export
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId } = await params;
    await requireTree(treeId);
    await requireTreeAccess(treeId, session.user.id, "VIEWER");

    const body = await req.json();
    const parsed = exportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // For JSON export, return data directly
    if (parsed.data.format === "JSON") {
      const [people, relationships] = await Promise.all([
        prisma.person.findMany({ where: { treeId, deletedAt: null } }),
        prisma.relationship.findMany({ where: { treeId, deletedAt: null } }),
      ]);

      const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });

      await logActivity({
        treeId,
        userId: session.user.id,
        action: "EXPORT_REQUESTED",
        entityType: "tree",
        entityId: treeId,
        metadata: { format: "JSON" },
      });

      return NextResponse.json({
        data: {
          tree,
          people,
          relationships,
          exportedAt: new Date().toISOString(),
          format: "JSON",
        },
      });
    }

    // For PDF/PNG, create an export job (background processing)
    const job = await prisma.exportJob.create({
      data: {
        treeId,
        userId: session.user.id,
        format: parsed.data.format,
        status: "PENDING",
      },
    });

    await logActivity({
      treeId,
      userId: session.user.id,
      action: "EXPORT_REQUESTED",
      entityType: "exportJob",
      entityId: job.id,
      metadata: { format: parsed.data.format },
    });

    return NextResponse.json({ data: job }, { status: 202 });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}
