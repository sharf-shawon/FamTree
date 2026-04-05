"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Trees, Search, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Prisma } from "@prisma/client";

type FamilyTreeWithCount = Prisma.FamilyTreeGetPayload<{
  include: { _count: { select: { people: true; relationships: true } } };
}>;

interface TreeItem extends FamilyTreeWithCount {
  role: string;
}

const roleColors: Record<string, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  EDITOR: "secondary",
  CONTRIBUTOR: "secondary",
  VIEWER: "outline",
};

export function TreesContent({ trees }: { trees: TreeItem[] }) {
  const [search, setSearch] = useState("");

  const filtered = trees.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Family Trees</h1>
          <p className="mt-1 text-muted-foreground">
            {trees.length} tree{trees.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/trees/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Tree
          </Button>
        </Link>
      </div>

      {trees.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search trees..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="text-center p-12">
          <Trees className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <CardTitle className="mb-2">
            {search ? "No trees match your search" : "No family trees yet"}
          </CardTitle>
          <CardDescription className="mb-6">
            {search
              ? "Try a different search term."
              : "Create your first family tree to get started."}
          </CardDescription>
          {!search && (
            <Link href="/trees/new">
              <Button>
                <Plus className="h-4 w-4" />
                Create a tree
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tree) => (
            <Link key={tree.id} href={`/trees/${tree.id}`}>
              <Card className="group cursor-pointer transition-shadow hover:shadow-md h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {tree.name}
                    </CardTitle>
                    <div className="flex gap-1 shrink-0">
                      <Badge variant={roleColors[tree.role]}>
                        {tree.role}
                      </Badge>
                      {tree.isPrivate ? (
                        <Lock className="h-4 w-4 text-muted-foreground mt-0.5" aria-label="Private" />
                      ) : (
                        <Unlock className="h-4 w-4 text-muted-foreground mt-0.5" aria-label="Shared" />
                      )}
                    </div>
                  </div>
                  {tree.description && (
                    <CardDescription className="line-clamp-2">
                      {tree.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{tree._count?.people ?? 0} people</span>
                    <span>{tree._count?.relationships ?? 0} relationships</span>
                  </div>
                  {tree.parentTreeId && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Branched from another tree
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
