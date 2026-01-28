"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface AgentIDEProps {
  code: string;
  onChange: (value: string) => void;
  activePanel: "preview" | "ide";
  onSwitchToPreview: () => void;
  onSwitchToIDE: () => void;
  className?: string;
}

export function AgentIDE({
  code,
  onChange,
  activePanel,
  onSwitchToPreview,
  onSwitchToIDE,
  className,
}: AgentIDEProps) {
  return (
    <div className={cn("flex size-full flex-col bg-card", className)}>
      <div className="flex items-center justify-between border-b p-2 h-14">
        <div className="flex items-center gap-1">
          <Button
            variant={activePanel === "preview" ? "secondary" : "ghost"}
            size="sm"
            onClick={onSwitchToPreview}
          >
            Preview
          </Button>
          <Button
            variant={activePanel === "ide" ? "secondary" : "ghost"}
            size="sm"
            onClick={onSwitchToIDE}
          >
            Agent IDE
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">Monaco Editor</span>
      </div>
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          defaultLanguage="typescript"
          theme="vs-dark"
          value={code}
          onChange={(value) => onChange(value ?? "")}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
