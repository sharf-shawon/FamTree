import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { NewTreeForm } from "./new-tree-form";

export default async function NewTreePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  return (
    <AppShell
      userName={session.user.name}
      userImage={session.user.image}
      userEmail={session.user.email}
    >
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">Create a Family Tree</h1>
        <NewTreeForm />
      </div>
    </AppShell>
  );
}
