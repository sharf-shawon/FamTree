"use client";

import { useState } from "react";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X } from "lucide-react";

type PersonType = Prisma.PersonGetPayload<Record<string, never>>;
type RelationshipType = Prisma.RelationshipGetPayload<Record<string, never>>;

interface AddRelationshipDialogProps {
  treeId: string;
  people: PersonType[];
  onClose: () => void;
  onAdded: (rel: RelationshipType) => void;
}

export function AddRelationshipDialog({
  treeId,
  people,
  onClose,
  onAdded,
}: AddRelationshipDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLSelectElement)?.value;

    const type = getValue("type");
    const subtype = getValue("subtype");

    const data = {
      subjectId: getValue("subjectId"),
      objectId: getValue("objectId"),
      type,
      subtype: subtype || undefined,
      isUncertain: false,
    };

    if (data.subjectId === data.objectId) {
      setError("Subject and object cannot be the same person.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/trees/${treeId}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Failed to add relationship");
        return;
      }
      onAdded(json.data);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const personOptions = people.map((p) => (
    <option key={p.id} value={p.id}>
      {p.firstName}{p.lastName ? ` ${p.lastName}` : ""}
    </option>
  ));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Relationship</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="subjectId">Person 1 (subject)</Label>
            <Select id="subjectId" name="subjectId" required>
              <option value="">Select a person...</option>
              {personOptions}
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="type">Relationship type</Label>
            <Select id="type" name="type" required defaultValue="PARENT_CHILD">
              <option value="PARENT_CHILD">Parent → Child</option>
              <option value="PARTNER">Partner / Marriage</option>
              <option value="SIBLING">Sibling</option>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="subtype">Subtype (optional)</Label>
            <Select id="subtype" name="subtype">
              <option value="">None</option>
              <option value="BIOLOGICAL">Biological</option>
              <option value="ADOPTIVE">Adoptive</option>
              <option value="STEP">Step</option>
              <option value="FOSTER">Foster</option>
              <option value="GUARDIAN">Guardian</option>
              <option value="MARRIED">Married</option>
              <option value="DIVORCED">Divorced</option>
              <option value="SEPARATED">Separated</option>
              <option value="PARTNERED">Partnered</option>
              <option value="UNKNOWN">Unknown</option>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="objectId">Person 2 (object)</Label>
            <Select id="objectId" name="objectId" required>
              <option value="">Select a person...</option>
              {personOptions}
            </Select>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Adding..." : "Add Relationship"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
