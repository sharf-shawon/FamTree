import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inviteSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { generateInviteExpiry } from "@/lib/utils";
import {
  apiError,
  AuthError,
  requireTree,
  requireTreeAccess,
} from "@/lib/permissions";

type Params = { params: Promise<{ treeId: string }> };

// GET /api/trees/[treeId]/invitations
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId } = await params;
    await requireTree(treeId);
    await requireTreeAccess(treeId, session.user.id, "EDITOR");

    const invitations = await prisma.invitation.findMany({
      where: { treeId },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: invitations });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}

// POST /api/trees/[treeId]/invitations
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId } = await params;
    await requireTree(treeId);
    await requireTreeAccess(treeId, session.user.id, "EDITOR");

    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    // Check for existing active invitation
    const existing = await prisma.invitation.findFirst({
      where: { treeId, email, status: "PENDING" },
    });
    if (existing) {
      return NextResponse.json(
        { message: "An invitation has already been sent to this email." },
        { status: 409 }
      );
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const alreadyMember = await prisma.treeMembership.findUnique({
        where: { treeId_userId: { treeId, userId: existingUser.id } },
      });
      if (alreadyMember) {
        return NextResponse.json(
          { message: "This user is already a member of this tree." },
          { status: 409 }
        );
      }
    }

    const invitation = await prisma.invitation.create({
      data: {
        treeId,
        email,
        role,
        senderId: session.user.id,
        expiresAt: generateInviteExpiry(),
      },
    });

    await logActivity({
      treeId,
      userId: session.user.id,
      action: "MEMBER_INVITED",
      entityType: "invitation",
      entityId: invitation.id,
      metadata: { email, role },
    });

    return NextResponse.json({ data: invitation }, { status: 201 });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}
