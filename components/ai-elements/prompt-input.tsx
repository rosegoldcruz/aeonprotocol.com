"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUp, Square } from "lucide-react";

export interface PromptInputMessage {
  text?: string;
  files?: File[];
}

interface PromptInputContextValue {
  value: string;
  setValue: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  isLoading: boolean;
}

const PromptInputContext = React.createContext<PromptInputContextValue | null>(null);

function usePromptInput() {
  const context = React.useContext(PromptInputContext);
  if (!context) {
    throw new Error("usePromptInput must be used within a PromptInput");
  }
  return context;
}

interface PromptInputProps extends React.HTMLAttributes<HTMLFormElement> {
  onSubmit: (message: PromptInputMessage) => void;
  isLoading?: boolean;
}

export function PromptInput({
  children,
  className,
  onSubmit,
  isLoading = false,
  ...props
}: PromptInputProps) {
  const [value, setValue] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit({ text: value });
    }
  };

  return (
    <PromptInputContext.Provider value={{ value, setValue, onSubmit, isLoading }}>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex items-end gap-2 rounded-xl border bg-card p-2",
          className
        )}
        {...props}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  );
}

interface PromptInputTextareaProps extends React.ComponentProps<typeof Textarea> {}

export function PromptInputTextarea({
  className,
  onChange,
  value: controlledValue,
  ...props
}: PromptInputTextareaProps) {
  const { value, setValue, onSubmit, isLoading } = usePromptInput();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const displayValue = controlledValue !== undefined ? controlledValue : value;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    onChange?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (displayValue && !isLoading) {
        onSubmit({ text: String(displayValue) });
      }
    }
  };

  return (
    <Textarea
      ref={textareaRef}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="Describe the app you want to build..."
      className={cn(
        "min-h-[60px] flex-1 border-0 bg-transparent p-2 shadow-none focus-visible:ring-0",
        className
      )}
      {...props}
    />
  );
}

interface PromptInputSubmitProps extends React.ComponentProps<typeof Button> {
  status?: "ready" | "streaming";
}

export function PromptInputSubmit({
  className,
  status = "ready",
  disabled,
  ...props
}: PromptInputSubmitProps) {
  const { value, isLoading } = usePromptInput();

  return (
    <Button
      type="submit"
      size="icon"
      disabled={disabled || (!value.trim() && status === "ready") || isLoading}
      className={cn("h-8 w-8 shrink-0", className)}
      {...props}
    >
      {status === "streaming" ? (
        <Square className="h-4 w-4 fill-current" />
      ) : (
        <ArrowUp className="h-4 w-4" />
      )}
    </Button>
  );
}
