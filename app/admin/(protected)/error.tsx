"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
      <h2 className="mb-2 font-display text-xl font-medium text-red-900">
        Something went wrong!
      </h2>
      <p className="mb-6 max-w-md text-sm text-red-700/80">
        We encountered an error loading this section. Please try again.
        <br />
        <span className="text-xs opacity-75">{error.message}</span>
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
