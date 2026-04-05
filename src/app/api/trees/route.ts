import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createTreeSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { apiError, AuthError } from "@/lib/permissions";

// GET /api/trees - list trees the current user is a member of
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const memberships = await prisma.treeMembership.findMany({
      where: { userId: session.user.id },
      include: {
        tree: {
          include: {
            _count: { select: { people: true, relationships: true } },
            members: {
              include: {
                user: { select: { id: true, name: true, image: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const trees = memberships
      .filter((m) => !m.tree.deletedAt)
      .map((m) => ({ ...m.tree, role: m.role }));

    return NextResponse.json({ data: trees });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}

// POST /api/trees - create a new tree
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const body = await req.json();
    const parsed = createTreeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const tree = await prisma.familyTree.create({
      data: {
        ...parsed.data,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    await logActivity({
      treeId: tree.id,
      userId: session.user.id,
      action: "TREE_CREATED",
      entityType: "tree",
      entityId: tree.id,
      metadata: { name: tree.name },
    });

    return NextResponse.json({ data: tree }, { status: 201 });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}
