"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: "user" | "assistant";
}

export function Message({ children, className, from, ...props }: MessageProps) {
  return (
    <div
      className={cn(
        "flex gap-3 py-4",
        from === "user" ? "flex-row-reverse" : "flex-row",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          from === "user" ? "bg-primary" : "bg-muted"
        )}
      >
        {from === "user" ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div
        className={cn(
          "flex-1 space-y-2",
          from === "user" ? "text-right" : "text-left"
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function MessageContent({
  children,
  className,
  ...props
}: MessageContentProps) {
  return (
    <div
      className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
      {...props}
    >
      {children}
    </div>
  );
}
