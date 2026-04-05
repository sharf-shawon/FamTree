import Link from "next/link";
import { GitBranch, Lock, Users, Share2, Download, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Lock,
    title: "Private by Default",
    description:
      "Your family data stays private. Only invited members can view your tree.",
  },
  {
    icon: Users,
    title: "Collaborative Editing",
    description:
      "Invite relatives with fine-grained roles: Owner, Editor, Contributor, or Viewer.",
  },
  {
    icon: GitBranch,
    title: "Branch & Fork",
    description:
      "Create a private copy of any tree you have access to, with full ownership.",
  },
  {
    icon: Share2,
    title: "Connect Families",
    description:
      "Propose links between separate family trees without losing ownership.",
  },
  {
    icon: Download,
    title: "Export Anywhere",
    description:
      "Download your tree as PDF, PNG, or JSON for backup and sharing.",
  },
  {
    icon: Shield,
    title: "Privacy Controls",
    description:
      "Living person visibility, field-level restrictions, and secure defaults.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">FamTree</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/auth/signin">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/auth/signin">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero section */}
        <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
            Your family story,{" "}
            <span className="text-primary">privately told.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            FamTree is a secure, collaborative platform for creating and sharing
            private family trees. Invite relatives, track relationships, and
            preserve your history — all with strong privacy protections.
          </p>
          <div className="mt-10 flex gap-4">
            <Link href="/auth/signin">
              <Button size="lg">Start your tree</Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                Learn more
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="border-t bg-muted/40 px-6 py-24"
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Everything you need
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-lg border bg-card p-6 shadow-sm"
                >
                  <Icon className="mb-4 h-8 w-8 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} FamTree. All rights reserved.
      </footer>
    </div>
  );
}
