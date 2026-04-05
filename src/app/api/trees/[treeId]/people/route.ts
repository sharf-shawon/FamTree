import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { personSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import {
  apiError,
  AuthError,
  requireTree,
  requireTreeAccess,
} from "@/lib/permissions";

type Params = { params: Promise<{ treeId: string }> };

// GET /api/trees/[treeId]/people
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId } = await params;
    await requireTree(treeId);
    await requireTreeAccess(treeId, session.user.id, "VIEWER");

    const people = await prisma.person.findMany({
      where: { treeId, deletedAt: null },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json({ data: people });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}

// POST /api/trees/[treeId]/people
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId } = await params;
    await requireTree(treeId);
    await requireTreeAccess(treeId, session.user.id, "CONTRIBUTOR");

    const body = await req.json();
    const parsed = personSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const person = await prisma.person.create({
      data: { ...parsed.data, treeId },
    });

    await logActivity({
      treeId,
      userId: session.user.id,
      action: "PERSON_CREATED",
      entityType: "person",
      entityId: person.id,
      metadata: { name: `${person.firstName} ${person.lastName ?? ""}`.trim() },
    });

    return NextResponse.json({ data: person }, { status: 201 });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}
