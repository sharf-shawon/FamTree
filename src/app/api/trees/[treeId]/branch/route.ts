import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import {
  apiError,
  AuthError,
  NotFoundError,
  requireTree,
  requireTreeAccess,
} from "@/lib/permissions";

type Params = { params: Promise<{ treeId: string }> };

// POST /api/trees/[treeId]/branch - branch/clone a tree
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthError();

    const { treeId } = await params;
    const sourceTree = await requireTree(treeId);
    const userId = session.user.id!;
    await requireTreeAccess(treeId, userId, "VIEWER");

    // Copy tree
    const newTree = await prisma.$transaction(async (tx) => {
      const branchedTree = await tx.familyTree.create({
        data: {
          name: `${sourceTree.name} (Branch)`,
          description: sourceTree.description,
          isPrivate: true,
          parentTreeId: sourceTree.id,
          branchedAt: new Date(),
          members: {
            create: {
              userId,
              role: "OWNER",
            },
          },
        },
      });

      // Copy all active people
      const people = await tx.person.findMany({
        where: { treeId, deletedAt: null },
      });

      const personIdMap = new Map<string, string>();
      for (const person of people) {
        const { id, treeId: _tid, createdAt, updatedAt, ...personData } = person;
        const newPerson = await tx.person.create({
          data: { ...personData, treeId: branchedTree.id },
        });
        personIdMap.set(id, newPerson.id);
      }

      // Copy all active relationships
      const relationships = await tx.relationship.findMany({
        where: { treeId, deletedAt: null },
      });

      for (const rel of relationships) {
        const newSubjectId = personIdMap.get(rel.subjectId);
        const newObjectId = personIdMap.get(rel.objectId);
        if (!newSubjectId || !newObjectId) continue;
        const { id, treeId: _tid, createdAt, updatedAt, ...relData } = rel;
        await tx.relationship.create({
          data: { ...relData, treeId: branchedTree.id, subjectId: newSubjectId, objectId: newObjectId },
        });
      }

      return branchedTree;
    });

    await logActivity({
      treeId: newTree.id,
      userId,
      action: "TREE_BRANCHED",
      entityType: "tree",
      entityId: newTree.id,
      metadata: { sourceTreeId: treeId, sourceName: sourceTree.name },
    });

    return NextResponse.json({ data: newTree }, { status: 201 });
  } catch (err) {
    const { message, status } = apiError(err);
    return NextResponse.json({ message }, { status });
  }
}
