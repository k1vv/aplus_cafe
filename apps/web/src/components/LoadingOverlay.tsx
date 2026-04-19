import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingOverlay({ message = "Please wait...", fullScreen = true }: LoadingOverlayProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
          {message}
        </p>
      </div>
    </div>
  );
}

// Inline loading spinner for buttons
export function LoadingSpinner({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return <Loader2 className={`${sizeClasses[size]} animate-spin`} />;
}
