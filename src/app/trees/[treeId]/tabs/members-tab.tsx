"use client";

import { useState } from "react";
import type { Prisma } from "@prisma/client";
import { TreeRole } from "@prisma/client";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

type MemberType = Prisma.TreeMembershipGetPayload<{
  include: {
    user: { select: { id: true; name: true; image: true; email: true } };
  };
}>;

interface MembersTabProps {
  treeId: string;
  members: MemberType[];
  currentUserId: string;
  role: TreeRole;
  canManage: boolean;
}

const roleColors: Record<string, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  EDITOR: "secondary",
  CONTRIBUTOR: "secondary",
  VIEWER: "outline",
};

export function MembersTab({
  treeId,
  members,
  currentUserId,
  canManage,
}: Omit<MembersTabProps, "role">) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"EDITOR" | "CONTRIBUTOR" | "VIEWER">("VIEWER");
  const [sending, setSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setInviteResult(null);
    try {
      const res = await fetch(`/api/trees/${treeId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const json = await res.json();
      if (res.ok) {
        setInviteResult({
          type: "success",
          message: `Invitation sent to ${inviteEmail}.`,
        });
        setInviteEmail("");
      } else {
        setInviteResult({ type: "error", message: json.message ?? "Failed to send invitation" });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite form */}
      {canManage && (
        <div className="rounded-lg border p-4 space-y-4">
          <h3 className="font-semibold">Invite a member</h3>

          {inviteResult && (
            <Alert variant={inviteResult.type === "success" ? "success" : "destructive"}>
              <AlertDescription>{inviteResult.message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleInvite} className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-48">
              <Label htmlFor="invite-email" className="sr-only">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                disabled={sending}
              />
            </div>
            <div className="w-36">
              <Label htmlFor="invite-role" className="sr-only">Role</Label>
              <Select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                disabled={sending}
              >
                <option value="VIEWER">Viewer</option>
                <option value="CONTRIBUTOR">Contributor</option>
                <option value="EDITOR">Editor</option>
              </Select>
            </div>
            <Button type="submit" size="sm" disabled={sending || !inviteEmail}>
              <UserPlus className="h-4 w-4" />
              {sending ? "Sending..." : "Invite"}
            </Button>
          </form>
        </div>
      )}

      {/* Current members */}
      <div>
        <h3 className="mb-3 font-semibold">{members.length} member{members.length !== 1 ? "s" : ""}</h3>
        <div className="divide-y rounded-lg border">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-4 p-4">
              {m.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.user.image}
                  alt={m.user.name ?? ""}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {m.user.name?.[0]?.toUpperCase() ?? m.user.email?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {m.user.name ?? m.user.email}
                  {m.user.id === currentUserId && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
                {m.user.name && (
                  <p className="text-sm text-muted-foreground truncate">{m.user.email}</p>
                )}
              </div>
              <Badge variant={roleColors[m.role]}>{m.role}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
