"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, X } from "lucide-react";

interface ExportDialogProps {
  treeId: string;
  onClose: () => void;
}

export function ExportDialog({ treeId, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<"JSON" | "PDF" | "PNG">("JSON");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trees/${treeId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Export failed");
        return;
      }

      if (format === "JSON") {
        // Direct download
        const blob = new Blob([JSON.stringify(json.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `family-tree-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        onClose();
      } else {
        // Job queued
        alert(`Export job created (ID: ${json.data.id}). You'll be notified when ready.`);
        onClose();
      }
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Export Tree</h2>
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

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="export-format">Format</Label>
            <Select
              id="export-format"
              value={format}
              onChange={(e) => setFormat(e.target.value as typeof format)}
            >
              <option value="JSON">JSON (immediate download)</option>
              <option value="PDF">PDF (queued)</option>
              <option value="PNG">PNG (queued)</option>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            {format === "JSON"
              ? "Download your family tree data as a JSON backup file."
              : `A ${format} export job will be created. PDF/PNG exports are processed asynchronously.`}
          </p>

          <div className="flex gap-3">
            <Button onClick={handleExport} disabled={loading} className="flex-1">
              <Download className="h-4 w-4" />
              {loading ? "Exporting..." : "Export"}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
