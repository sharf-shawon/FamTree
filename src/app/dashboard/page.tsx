import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const memberships = await prisma.treeMembership.findMany({
    where: { userId: session.user.id },
    include: {
      tree: {
        include: {
          _count: { select: { people: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
    take: 5,
  });

  const trees = memberships
    .filter((m) => !m.tree.deletedAt)
    .map((m) => ({ ...m.tree, role: m.role }));

  return (
    <AppShell
      userName={session.user.name}
      userImage={session.user.image}
      userEmail={session.user.email}
    >
      <DashboardContent
        userName={session.user.name}
        trees={trees}
      />
    </AppShell>
  );
}
