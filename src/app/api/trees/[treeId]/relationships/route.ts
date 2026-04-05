import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { relationshipSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import {
  apiError,
  AuthError,
  requireTree,
  requireTreeAccess,
} from "@/lib/permissions";

type Params = { params: Promise<{ treeId: string }> };

// GET /api/trees/[treeId]/relationships
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId } = await params;
    await requireTree(treeId);
    await requireTreeAccess(treeId, session.user.id, "VIEWER");

    const relationships = await prisma.relationship.findMany({
      where: { treeId, deletedAt: null },
      include: {
        subject: {
          select: { id: true, firstName: true, lastName: true, isLiving: true, hideDetails: true },
        },
        object: {
          select: { id: true, firstName: true, lastName: true, isLiving: true, hideDetails: true },
        },
      },
    });

    return NextResponse.json({ data: relationships });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}

// POST /api/trees/[treeId]/relationships
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId } = await params;
    await requireTree(treeId);
    await requireTreeAccess(treeId, session.user.id, "CONTRIBUTOR");

    const body = await req.json();
    const parsed = relationshipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Verify both people belong to this tree
    const [subject, object] = await Promise.all([
      prisma.person.findFirst({ where: { id: parsed.data.subjectId, treeId, deletedAt: null } }),
      prisma.person.findFirst({ where: { id: parsed.data.objectId, treeId, deletedAt: null } }),
    ]);

    if (!subject || !object) {
      return NextResponse.json(
        { message: "One or both people not found in this tree." },
        { status: 400 }
      );
    }

    const relationship = await prisma.relationship.create({
      data: { ...parsed.data, treeId },
    });

    await logActivity({
      treeId,
      userId: session.user.id,
      action: "RELATIONSHIP_CREATED",
      entityType: "relationship",
      entityId: relationship.id,
    });

    return NextResponse.json({ data: relationship }, { status: 201 });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}
