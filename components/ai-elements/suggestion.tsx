"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface SuggestionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Suggestions({ children, className, ...props }: SuggestionsProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-2 mb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface SuggestionProps extends React.ComponentProps<typeof Button> {
  suggestion: string;
}

export function Suggestion({
  suggestion,
  className,
  ...props
}: SuggestionProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "h-auto py-2 px-3 text-xs font-normal text-left whitespace-normal",
        className
      )}
      {...props}
    >
      <Sparkles className="h-3 w-3 mr-2 shrink-0" />
      {suggestion}
    </Button>
  );
}
