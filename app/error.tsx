"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <article className="content-section article-card text-center py-10">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="p-3 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
        <p className="article-content text-muted-foreground max-w-md mx-auto">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <button
          onClick={() => reset()}
          className="btn outline-primary inline-flex items-center gap-2 mt-2 px-4 py-2 font-medium"
        >
          <RotateCcw size={16} />
          <span>Try again</span>
        </button>
      </div>
    </article>
  );
}
