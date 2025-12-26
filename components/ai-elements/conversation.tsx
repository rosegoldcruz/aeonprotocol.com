"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Conversation({ children, className, ...props }: ConversationProps) {
  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {children}
    </div>
  );
}

interface ConversationContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ConversationContent({
  children,
  className,
  ...props
}: ConversationContentProps) {
  return (
    <div className={cn("flex flex-col divide-y", className)} {...props}>
      {children}
    </div>
  );
}
