"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

type ActivityAction = string;

interface ActivityEntry {
  id: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    email: string | null;
  };
}

const ACTION_LABELS: Partial<Record<ActivityAction, string>> = {
  TREE_CREATED: "created this tree",
  TREE_UPDATED: "updated tree settings",
  TREE_BRANCHED: "branched the tree",
  PERSON_CREATED: "added a person",
  PERSON_UPDATED: "updated a person",
  PERSON_DELETED: "removed a person",
  RELATIONSHIP_CREATED: "added a relationship",
  RELATIONSHIP_UPDATED: "updated a relationship",
  RELATIONSHIP_DELETED: "removed a relationship",
  MEMBER_INVITED: "invited a member",
  MEMBER_JOINED: "joined the tree",
  MEMBER_REMOVED: "removed a member",
  EXPORT_REQUESTED: "exported the tree",
  TREE_LINK_PROPOSED: "proposed a tree link",
};

export function ActivityTab({ treeId }: { treeId: string }) {
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchLogs = async (cursor?: string) => {
    try {
      const url = new URL(`/api/trees/${treeId}/activity`, window.location.origin);
      if (cursor) url.searchParams.set("cursor", cursor);
      const res = await fetch(url.toString());
      const json = await res.json();
      if (res.ok) {
        setLogs((prev) => (cursor ? [...prev, ...json.data] : json.data));
        setNextCursor(json.nextCursor ?? null);
      } else {
        setError(json.message ?? "Failed to load activity");
      }
    } catch {
      setError("Failed to load activity log");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [treeId]);

  if (loading) {
    return <p className="py-8 text-center text-muted-foreground">Loading activity...</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-destructive">{error}</p>;
  }

  if (logs.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">No activity yet.</p>;
  }

  return (
    <div className="space-y-1">
      <div className="divide-y rounded-lg border">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 p-3">
            {log.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={log.user.image}
                alt={log.user.name ?? ""}
                className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {(log.user.name ?? log.user.email ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">
                  {log.user.name ?? log.user.email ?? "Someone"}
                </span>{" "}
                {ACTION_LABELS[log.action] ?? log.action.toLowerCase().replace(/_/g, " ")}
                {log.metadata && typeof log.metadata === "object" && "name" in log.metadata && (
                  <span className="text-muted-foreground"> &quot;{String(log.metadata.name)}&quot;</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      {nextCursor && (
        <div className="py-2 text-center">
          <button
            className="text-sm text-primary hover:underline"
            onClick={() => {
              setLoadingMore(true);
              fetchLogs(nextCursor);
            }}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
