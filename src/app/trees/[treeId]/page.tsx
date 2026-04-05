import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { TreeDetailContent } from "./tree-detail-content";
import { requireTreeAccess } from "@/lib/permissions";

interface PageProps {
  params: Promise<{ treeId: string }>;
}

export default async function TreeDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { treeId } = await params;

  // Check access (will throw if no access)
  let membership;
  try {
    membership = await requireTreeAccess(treeId, session.user.id, "VIEWER");
  } catch {
    notFound();
  }

  const tree = await prisma.familyTree.findFirst({
    where: { id: treeId, deletedAt: null },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
        },
      },
      _count: { select: { people: true, relationships: true } },
    },
  });

  if (!tree) notFound();

  const people = await prisma.person.findMany({
    where: { treeId, deletedAt: null },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const relationships = await prisma.relationship.findMany({
    where: { treeId, deletedAt: null },
  });

  return (
    <AppShell
      userName={session.user.name}
      userImage={session.user.image}
      userEmail={session.user.email}
    >
      <TreeDetailContent
        tree={tree}
        role={membership.role}
        userId={session.user.id}
        people={people}
        relationships={relationships}
      />
    </AppShell>
  );
}
