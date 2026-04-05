import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { personSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import {
  apiError,
  AuthError,
  NotFoundError,
  requireTree,
  requireTreeAccess,
} from "@/lib/permissions";

type Params = { params: Promise<{ treeId: string; personId: string }> };

// GET /api/trees/[treeId]/people/[personId]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId, personId } = await params;
    await requireTree(treeId);
    await requireTreeAccess(treeId, session.user.id, "VIEWER");

    const person = await prisma.person.findFirst({
      where: { id: personId, treeId, deletedAt: null },
      include: {
        relationshipsAsSubject: {
          where: { deletedAt: null },
          include: {
            object: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                isLiving: true,
                hideDetails: true,
                profileImageUrl: true,
              },
            },
          },
        },
        relationshipsAsObject: {
          where: { deletedAt: null },
          include: {
            subject: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                isLiving: true,
                hideDetails: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!person) throw new NotFoundError("Person not found.");

    return NextResponse.json({ data: person });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}

// PATCH /api/trees/[treeId]/people/[personId]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId, personId } = await params;
    await requireTree(treeId);
    await requireTreeAccess(treeId, session.user.id, "CONTRIBUTOR");

    const existing = await prisma.person.findFirst({
      where: { id: personId, treeId, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Person not found.");

    const body = await req.json();
    const parsed = personSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const person = await prisma.person.update({
      where: { id: personId },
      data: { ...parsed.data, version: { increment: 1 } },
    });

    await logActivity({
      treeId,
      userId: session.user.id,
      action: "PERSON_UPDATED",
      entityType: "person",
      entityId: person.id,
    });

    return NextResponse.json({ data: person });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}

// DELETE /api/trees/[treeId]/people/[personId] - soft delete
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId, personId } = await params;
    await requireTree(treeId);
    await requireTreeAccess(treeId, session.user.id, "EDITOR");

    const existing = await prisma.person.findFirst({
      where: { id: personId, treeId, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Person not found.");

    await prisma.person.update({
      where: { id: personId },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      treeId,
      userId: session.user.id,
      action: "PERSON_DELETED",
      entityType: "person",
      entityId: personId,
    });

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}
