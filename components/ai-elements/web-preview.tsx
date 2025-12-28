"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { RefreshCw, ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuildLoader } from "./build-loader";

interface WebPreviewContextValue {
  url?: string;
  setUrl: (url: string) => void;
  refresh: () => void;
  refreshKey: number;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const WebPreviewContext = React.createContext<WebPreviewContextValue | null>(null);

function useWebPreview() {
  const context = React.useContext(WebPreviewContext);
  if (!context) {
    throw new Error("useWebPreview must be used within a WebPreview");
  }
  return context;
}

interface WebPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
}

export function WebPreview({ children, className, isLoading = false, ...props }: WebPreviewProps) {
  const [url, setUrl] = React.useState<string>();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [loading, setIsLoading] = React.useState(isLoading);

  React.useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const contextValue = { url, setUrl, refresh, refreshKey, isLoading: loading, setIsLoading };

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

interface WebPreviewNavigationProps extends React.HTMLAttributes<HTMLDivElement> { }

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

interface WebPreviewUrlProps extends React.ComponentProps<typeof Input> { }

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

interface WebPreviewBodyProps extends React.IframeHTMLAttributes<HTMLIFrameElement> { }

export function WebPreviewBody({ className, src, ...props }: WebPreviewBodyProps) {
  const { url, refreshKey, isLoading } = useWebPreview();
  const iframeSrc = src || url;

  // Show awesome loading screen while building
  if (isLoading) {
    return <BuildLoader />;
  }

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

  // Demos block iframe embedding, show a button to open in new tab
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/50">
      <div className="text-center space-y-6">
        <div className="text-6xl">✨</div>
        <div>
          <p className="text-2xl font-semibold mb-2">Your app is ready!</p>
          <p className="text-muted-foreground mb-6">Click below to view your generated app</p>
        </div>
        <Button
          size="lg"
          className="gap-2 text-lg px-8 py-6"
          onClick={() => window.open(iframeSrc, "_blank")}
        >
          <ExternalLink className="h-5 w-5" />
          Open Preview
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Opens in a new tab • Powered by AEON Agentic Technology
        </p>
      </div>
    </div>
  );
}
