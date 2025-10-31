/**
 * Reusable loading spinner component for Suspense boundaries
 */

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export function LoadingSpinner({
  message = "Loading...",
  size = "md",
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const containerClasses = fullScreen
    ? "min-h-screen flex items-center justify-center bg-gray-50"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <Loader2
          className={`${sizeClasses[size]} text-blue-600 animate-spin mx-auto mb-4`}
          aria-label="Loading"
        />
        {message && (
          <p className="text-gray-600 text-sm sm:text-base">{message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Full page loading spinner for route transitions
 */
export function PageLoadingSpinner({ message = "Loading page..." }: { message?: string }) {
  return <LoadingSpinner message={message} size="lg" fullScreen />;
}
