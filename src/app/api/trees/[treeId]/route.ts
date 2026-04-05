import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateTreeSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import {
  apiError,
  AuthError,
  NotFoundError,
  requireTree,
  requireTreeAccess,
  requireTreeOwner,
} from "@/lib/permissions";

type Params = { params: Promise<{ treeId: string }> };

// GET /api/trees/[treeId]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId } = await params;
    await requireTree(treeId);
    const membership = await requireTreeAccess(treeId, session.user.id, "VIEWER");

    const tree = await prisma.familyTree.findUnique({
      where: { id: treeId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, image: true, email: true } },
          },
        },
        _count: { select: { people: true, relationships: true } },
      },
    });

    return NextResponse.json({ data: { ...tree, role: membership.role } });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}

// PATCH /api/trees/[treeId]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId } = await params;
    await requireTree(treeId);
    await requireTreeAccess(treeId, session.user.id, "EDITOR");

    const body = await req.json();
    const parsed = updateTreeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const tree = await prisma.familyTree.update({
      where: { id: treeId },
      data: { ...parsed.data, version: { increment: 1 } },
    });

    await logActivity({
      treeId,
      userId: session.user.id,
      action: "TREE_UPDATED",
      entityType: "tree",
      entityId: treeId,
      metadata: parsed.data,
    });

    return NextResponse.json({ data: tree });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}

// DELETE /api/trees/[treeId] - soft delete
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId } = await params;
    await requireTree(treeId);
    await requireTreeOwner(treeId, session.user.id);

    await prisma.familyTree.update({
      where: { id: treeId },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      treeId,
      userId: session.user.id,
      action: "TREE_DELETED",
      entityType: "tree",
      entityId: treeId,
    });

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}
