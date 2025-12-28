"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  tenantId: string;
  id: string;
  name: string;
  demoUrl: string | null;
  chatId: string | null;
  createdAt: string;
}

interface ProjectSidebarProps {
  currentProjectId: string | null;
  onSelectProject: (project: Project) => void;
  onNewProject: () => void;
}

export function ProjectSidebar({
  currentProjectId,
  onSelectProject,
  onNewProject,
}: ProjectSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Refresh projects when a new one is created
  useEffect(() => {
    if (currentProjectId && !projects.find((p) => p.id === currentProjectId)) {
      fetchProjects();
    }
  }, [currentProjectId, projects]);

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this project?")) return;

    try {
      await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (currentProjectId === projectId) {
        onNewProject();
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <div className="w-64 bg-muted/30 border-r flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-center">
        <Image
          src="/aeon-badge-logo-hexagon.png"
          alt="Aeon Protocol"
          width={200}
          height={200}
          className="w-full max-w-[180px] h-auto object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]"
          priority
        />
      </div>

      {/* New Project Button */}
      <div className="p-3">
        <button
          onClick={onNewProject}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">New Project</span>
        </button>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            Loading...
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            No projects yet
          </div>
        ) : (
          <div className="space-y-1">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                  currentProjectId === project.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm truncate flex-1">{project.name}</span>
                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                  title="Delete project"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Aeon Protocol
        </p>
      </div>
    </div>
  );
}
