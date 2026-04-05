"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";
import type { TreeRole } from "@prisma/client";

type FamilyTreeDetail = Prisma.FamilyTreeGetPayload<{
  include: {
    members: {
      include: {
        user: { select: { id: true; name: true; image: true; email: true } };
      };
    };
    _count: { select: { people: true; relationships: true } };
  };
}>;

type PersonType = Prisma.PersonGetPayload<Record<string, never>>;
type RelationshipType = Prisma.RelationshipGetPayload<Record<string, never>>;
import { Users, GitBranch, Activity, Plus, Download, Link2, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TreeVisualization } from "@/components/visualization/tree-visualization";
import { PeopleTab } from "./tabs/people-tab";
import { MembersTab } from "./tabs/members-tab";
import { ActivityTab } from "./tabs/activity-tab";
import { ExportDialog } from "./dialogs/export-dialog";
import { AddPersonDialog } from "./dialogs/add-person-dialog";
import { AddRelationshipDialog } from "./dialogs/add-relationship-dialog";
import { cn } from "@/lib/utils";

interface TreeDetailProps {
  tree: FamilyTreeDetail;
  role: TreeRole;
  userId: string;
  people: PersonType[];
  relationships: RelationshipType[];
}

const tabs = [
  { id: "visualization", label: "Tree", icon: GitBranch },
  { id: "people", label: "People", icon: Users },
  { id: "members", label: "Members", icon: Users },
  { id: "activity", label: "Activity", icon: Activity },
];

const roleColors: Record<string, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  EDITOR: "secondary",
  CONTRIBUTOR: "secondary",
  VIEWER: "outline",
};

export function TreeDetailContent({
  tree,
  role,
  userId,
  people: initialPeople,
  relationships: initialRelationships,
}: TreeDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("visualization");
  const [people, setPeople] = useState(initialPeople);
  const [relationships, setRelationships] = useState(initialRelationships);
  const [selectedPerson, setSelectedPerson] = useState<PersonType | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [branching, setBranching] = useState(false);

  const canWrite = role === "OWNER" || role === "EDITOR" || role === "CONTRIBUTOR";
  const canManage = role === "OWNER" || role === "EDITOR";

  const handleBranch = async () => {
    if (!confirm("Create a private branch (copy) of this tree?")) return;
    setBranching(true);
    try {
      const res = await fetch(`/api/trees/${tree.id}/branch`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        router.push(`/trees/${json.data.id}`);
      } else {
        alert(json.message ?? "Failed to branch tree");
      }
    } finally {
      setBranching(false);
    }
  };

  const handlePersonAdded = (person: PersonType) => {
    setPeople((prev) => [...prev, person]);
    setShowAddPerson(false);
  };

  const handleRelationshipAdded = (rel: RelationshipType) => {
    setRelationships((prev) => [...prev, rel]);
    setShowAddRelationship(false);
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{tree.name}</h1>
            {tree.isPrivate ? (
              <Lock className="h-4 w-4 text-muted-foreground" aria-label="Private" />
            ) : (
              <Unlock className="h-4 w-4 text-muted-foreground" aria-label="Shared" />
            )}
            <Badge variant={roleColors[role]}>{role}</Badge>
          </div>
          {tree.description && (
            <p className="mt-1 text-sm text-muted-foreground">{tree.description}</p>
          )}
          {tree.parentTreeId && (
            <p className="mt-1 text-xs text-muted-foreground">
              Branched on {tree.branchedAt?.toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {canWrite && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddPerson(true)}
            >
              <Plus className="h-4 w-4" />
              Add Person
            </Button>
          )}
          {canWrite && people.length >= 2 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddRelationship(true)}
            >
              <Link2 className="h-4 w-4" />
              Add Relationship
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowExport(true)}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBranch}
            disabled={branching}
          >
            <GitBranch className="h-4 w-4" />
            {branching ? "Branching..." : "Branch"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab(id)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === "visualization" && (
          <div className="h-[600px]">
            <TreeVisualization
              people={people}
              relationships={relationships}
              onPersonClick={setSelectedPerson}
              selectedPersonId={selectedPerson?.id}
            />
          </div>
        )}

        {activeTab === "people" && (
          <PeopleTab
            treeId={tree.id}
            people={people}
            canWrite={canWrite}
            canDelete={canManage}
            onAdd={() => setShowAddPerson(true)}
            onPeopleChange={setPeople}
          />
        )}

        {activeTab === "members" && (
          <MembersTab
            treeId={tree.id}
            members={tree.members}
            currentUserId={userId}
            role={role}
            canManage={canManage}
          />
        )}

        {activeTab === "activity" && (
          <ActivityTab treeId={tree.id} />
        )}
      </div>

      {/* Dialogs */}
      {showExport && (
        <ExportDialog
          treeId={tree.id}
          onClose={() => setShowExport(false)}
        />
      )}

      {showAddPerson && (
        <AddPersonDialog
          treeId={tree.id}
          onClose={() => setShowAddPerson(false)}
          onAdded={handlePersonAdded}
        />
      )}

      {showAddRelationship && (
        <AddRelationshipDialog
          treeId={tree.id}
          people={people}
          onClose={() => setShowAddRelationship(false)}
          onAdded={handleRelationshipAdded}
        />
      )}
    </div>
  );
}
