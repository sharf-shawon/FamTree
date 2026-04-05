import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActivityLogs } from "@/lib/activity";
import {
  apiError,
  AuthError,
  requireTree,
  requireTreeAccess,
} from "@/lib/permissions";

type Params = { params: Promise<{ treeId: string }> };

// GET /api/trees/[treeId]/activity
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId } = await params;
    await requireTree(treeId);
    await requireTreeAccess(treeId, session.user.id, "VIEWER");

    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get("limit") ?? "50"),
      100
    );

    const logs = await getActivityLogs(treeId, cursor, limit);
    const nextCursor = logs.length === limit ? logs[logs.length - 1].id : undefined;

    return NextResponse.json({
      data: logs,
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}
