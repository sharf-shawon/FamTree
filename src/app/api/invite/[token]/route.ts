import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { apiError, AuthError, NotFoundError } from "@/lib/permissions";

type Params = { params: Promise<{ token: string }> };

// GET /api/invite/[token] - preview the invitation
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        tree: { select: { id: true, name: true } },
        sender: { select: { id: true, name: true, email: true } },
      },
    });

    if (!invitation) throw new NotFoundError("Invitation not found.");

    const now = new Date();
    if (invitation.expiresAt < now || invitation.status !== "PENDING") {
      return NextResponse.json(
        { message: "This invitation has expired or is no longer valid." },
        { status: 410 }
      );
    }

    return NextResponse.json({
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        tree: invitation.tree,
        sender: invitation.sender,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}

// POST /api/invite/[token] - accept the invitation
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { token } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) throw new NotFoundError("Invitation not found.");

    const now = new Date();
    if (invitation.expiresAt < now || invitation.status !== "PENDING") {
      return NextResponse.json(
        { message: "This invitation has expired or is no longer valid." },
        { status: 410 }
      );
    }

    // Check email matches (if user has a verified email)
    if (
      session.user.email &&
      invitation.email.toLowerCase() !== session.user.email.toLowerCase()
    ) {
      return NextResponse.json(
        { message: "This invitation was sent to a different email address." },
        { status: 403 }
      );
    }

    const userId = session.user.id!;

    await prisma.$transaction(async (tx) => {
      // Add membership
      await tx.treeMembership.upsert({
        where: {
          treeId_userId: { treeId: invitation.treeId, userId },
        },
        update: { role: invitation.role },
        create: {
          treeId: invitation.treeId,
          userId,
          role: invitation.role,
        },
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", receiverId: userId },
      });
    });

    await logActivity({
      treeId: invitation.treeId,
      userId,
      action: "MEMBER_JOINED",
      entityType: "invitation",
      entityId: invitation.id,
      metadata: { role: invitation.role },
    });

    return NextResponse.json({
      data: { treeId: invitation.treeId, role: invitation.role },
    });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}
