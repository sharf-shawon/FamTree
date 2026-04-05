"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { GitBranch, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

interface InviteData {
  id: string;
  email: string;
  role: string;
  tree: { id: string; name: string };
  sender: { name: string | null; email: string | null };
  expiresAt: string;
}

export function InviteAcceptContent({ token }: { token: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await fetch(`/api/invite/${token}`);
        const json = await res.json();
        if (res.ok) {
          setInvite(json.data);
        } else {
          setError(json.message ?? "Invitation not found or expired.");
        }
      } catch {
        setError("Failed to load invitation.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!session) return;
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invite/${token}`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        router.push(`/trees/${json.data.treeId}`);
      } else {
        setError(json.message ?? "Failed to accept invitation.");
      }
    } catch {
      setError("Failed to accept invitation.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading invitation...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <GitBranch className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">FamTree Invitation</h1>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : invite ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold">{invite.tree.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>{invite.sender.name ?? invite.sender.email}</strong> has
                invited you to collaborate as a{" "}
                <strong>{invite.role.toLowerCase()}</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                This invitation is for: <strong>{invite.email}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Expires: {new Date(invite.expiresAt).toLocaleDateString()}
              </p>
            </div>

            {status === "loading" ? (
              <p className="text-center text-sm text-muted-foreground">
                Checking your session...
              </p>
            ) : !session ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Sign in to accept this invitation.
                </p>
                <Link
                  href={`/auth/signin?callbackUrl=/invite/${token}`}
                  className="block"
                >
                  <Button className="w-full">Sign in to accept</Button>
                </Link>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? "Accepting..." : "Accept Invitation"}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
