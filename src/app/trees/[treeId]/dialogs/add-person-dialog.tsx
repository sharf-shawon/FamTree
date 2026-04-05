"use client";

import { useState } from "react";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X } from "lucide-react";

type PersonType = Prisma.PersonGetPayload<Record<string, never>>;

interface AddPersonDialogProps {
  treeId: string;
  onClose: () => void;
  onAdded: (person: PersonType) => void;
}

export function AddPersonDialog({ treeId, onClose, onAdded }: AddPersonDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value;

    const data = {
      firstName: getValue("firstName"),
      lastName: getValue("lastName") || undefined,
      gender: getValue("gender") || "UNKNOWN",
      birthDate: getValue("birthDate") || undefined,
      birthPlace: getValue("birthPlace") || undefined,
      deathDate: getValue("deathDate") || undefined,
      isLiving: getValue("isLiving") === "true",
      notes: getValue("notes") || undefined,
    };

    try {
      const res = await fetch(`/api/trees/${treeId}/people`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Failed to add person");
        return;
      }
      onAdded(json.data);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-lg my-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Person</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstName">First name *</Label>
              <Input id="firstName" name="firstName" required maxLength={100} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" maxLength={100} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="gender">Gender</Label>
            <Select id="gender" name="gender" defaultValue="UNKNOWN">
              <option value="UNKNOWN">Unknown</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="NON_BINARY">Non-binary</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="birthDate">Birth date</Label>
              <Input id="birthDate" name="birthDate" placeholder="e.g. 1950-01-15 or ~1950" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="birthPlace">Birth place</Label>
              <Input id="birthPlace" name="birthPlace" maxLength={200} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="isLiving">Status</Label>
            <Select id="isLiving" name="isLiving" defaultValue="true">
              <option value="true">Living</option>
              <option value="false">Deceased</option>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="deathDate">Death date (if deceased)</Label>
            <Input id="deathDate" name="deathDate" placeholder="e.g. 2020-05-03" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} maxLength={5000} placeholder="Optional notes..." />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Adding..." : "Add Person"}
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
