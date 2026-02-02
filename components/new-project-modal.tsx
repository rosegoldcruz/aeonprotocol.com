"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  isLoading?: boolean;
}

export function NewProjectModal({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}: NewProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    const trimmedName = projectName.trim();
    if (!trimmedName) {
      setError("Project name is required");
      return;
    }

    try {
      setError("");
      await onCreate(trimmedName);
      setProjectName("");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create project"
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold mb-4">Create New Project</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Project Name
            </label>
            <Input
              type="text"
              placeholder="Enter project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isLoading || !projectName.trim()}
            >
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
