"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { RefreshCw, ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebPreviewContextValue {
  url?: string;
  setUrl: (url: string) => void;
  refresh: () => void;
  refreshKey: number;
}

const WebPreviewContext = React.createContext<WebPreviewContextValue | null>(null);

function useWebPreview() {
  const context = React.useContext(WebPreviewContext);
  if (!context) {
    throw new Error("useWebPreview must be used within a WebPreview");
  }
  return context;
}

interface WebPreviewProps extends React.HTMLAttributes<HTMLDivElement> {}

export function WebPreview({ children, className, ...props }: WebPreviewProps) {
  const [url, setUrl] = React.useState<string>();
  const [refreshKey, setRefreshKey] = React.useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  const contextValue = { url, setUrl, refresh, refreshKey };

  return (
    <WebPreviewContext.Provider value={contextValue}>
      <div
        className={cn("flex size-full flex-col bg-card", className)}
        {...props}
      >
        {children}
      </div>
    </WebPreviewContext.Provider>
  );
}

interface WebPreviewNavigationProps extends React.HTMLAttributes<HTMLDivElement> {}

export function WebPreviewNavigation({
  className,
  children,
  ...props
}: WebPreviewNavigationProps) {
  const { url, refresh } = useWebPreview();

  return (
    <div
      className={cn("flex items-center gap-2 border-b p-2 h-14", className)}
      {...props}
    >
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={refresh}
          disabled={!url}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      {children}
      {url && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => window.open(url, "_blank")}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface WebPreviewUrlProps extends React.ComponentProps<typeof Input> {}

export function WebPreviewUrl({ className, value, ...props }: WebPreviewUrlProps) {
  const { url } = useWebPreview();

  return (
    <Input
      value={value || url || ""}
      className={cn(
        "flex-1 h-8 bg-muted/50 text-xs font-mono",
        className
      )}
      {...props}
    />
  );
}

interface WebPreviewBodyProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {}

export function WebPreviewBody({ className, src, ...props }: WebPreviewBodyProps) {
  const { url, refreshKey } = useWebPreview();
  const iframeSrc = src || url;

  if (!iframeSrc) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-4">🚀</div>
          <p className="text-lg font-medium">Your app preview will appear here</p>
          <p className="text-sm">Describe what you want to build and watch it come to life</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      key={refreshKey}
      src={iframeSrc}
      className={cn("flex-1 w-full border-0 bg-white", className)}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      {...props}
    />
  );
}
