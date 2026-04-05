"use client";

import { useState } from "react";
import type { Prisma } from "@prisma/client";
import { Plus, Search, Trash2, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type PersonType = Prisma.PersonGetPayload<Record<string, never>>;

interface PeopleTabProps {
  treeId: string;
  people: PersonType[];
  canWrite: boolean;
  canDelete: boolean;
  onAdd: () => void;
  onPeopleChange: (people: PersonType[]) => void;
}

export function PeopleTab({
  treeId,
  people,
  canWrite,
  canDelete,
  onAdd,
  onPeopleChange,
}: PeopleTabProps) {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = people.filter(
    (p) =>
      p.firstName.toLowerCase().includes(search.toLowerCase()) ||
      (p.lastName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (personId: string) => {
    if (!confirm("Soft-delete this person? They can be restored later.")) return;
    setDeleting(personId);
    try {
      const res = await fetch(`/api/trees/${treeId}/people/${personId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onPeopleChange(people.filter((p) => p.id !== personId));
      } else {
        const json = await res.json();
        alert(json.message ?? "Failed to delete person");
      }
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search people..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canWrite && (
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {search ? "No people match your search." : "No people added yet."}
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {filtered.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-4 p-4 hover:bg-muted/40"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white font-bold text-sm"
                style={{
                  backgroundColor:
                    person.gender === "MALE"
                      ? "#3b82f6"
                      : person.gender === "FEMALE"
                      ? "#ec4899"
                      : "#9ca3af",
                }}
                aria-hidden="true"
              >
                {person.firstName[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium">
                  {person.hideDetails && person.isLiving
                    ? "Living Person (details hidden)"
                    : `${person.firstName}${person.lastName ? ` ${person.lastName}` : ""}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[
                    person.birthDate ? `b. ${person.birthDate}` : null,
                    person.deathDate ? `d. ${person.deathDate}` : null,
                    !person.isLiving ? "Deceased" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {person.gender !== "UNKNOWN" && (
                  <Badge variant="outline" className="text-xs">
                    {person.gender.replace("_", " ").toLowerCase()}
                  </Badge>
                )}
                {person.hideDetails && (
                  <EyeOff className="h-4 w-4 text-muted-foreground" aria-label="Details hidden" />
                )}
                {person.isPrivate && (
                  <Badge variant="outline" className="text-xs">Private</Badge>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(person.id)}
                    disabled={deleting === person.id}
                    aria-label={`Delete ${person.firstName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
