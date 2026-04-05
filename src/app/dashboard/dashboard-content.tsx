"use client";

import Link from "next/link";
import { Plus, Trees, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  include: { _count: { select: { people: true } } };
}>;

interface DashboardTree extends FamilyTreeWithCount {
  role: string;
}

interface DashboardContentProps {
  userName?: string | null;
  trees: DashboardTree[];
}

const roleColors: Record<string, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  EDITOR: "secondary",
  CONTRIBUTOR: "secondary",
  VIEWER: "outline",
};

export function DashboardContent({ userName, trees }: DashboardContentProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your family trees and connections.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Trees</CardTitle>
            <Trees className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trees.length}</div>
            <p className="text-xs text-muted-foreground">
              {trees.filter((t) => t.role === "OWNER").length} owned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total People
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trees.reduce((sum, t) => sum + (t._count?.people ?? 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all your trees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent trees */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Trees</h2>
          <div className="flex gap-2">
            <Link href="/trees/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                New Tree
              </Button>
            </Link>
            <Link href="/trees">
              <Button size="sm" variant="outline">
                View all
              </Button>
            </Link>
          </div>
        </div>

        {trees.length === 0 ? (
          <Card className="text-center p-12">
            <Trees className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <CardTitle className="mb-2">No family trees yet</CardTitle>
            <CardDescription className="mb-6">
              Create your first family tree to get started.
            </CardDescription>
            <Link href="/trees/new">
              <Button>
                <Plus className="h-4 w-4" />
                Create a tree
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trees.map((tree) => (
              <Link key={tree.id} href={`/trees/${tree.id}`}>
                <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {tree.name}
                      </CardTitle>
                      <Badge variant={roleColors[tree.role]}>
                        {tree.role}
                      </Badge>
                    </div>
                    {tree.description && (
                      <CardDescription className="line-clamp-2">
                        {tree.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{tree._count?.people ?? 0} people</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
