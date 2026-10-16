"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "Error";

  return (
    <article className="content-section article-card text-center py-10">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="p-3 rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
          <AlertTriangle size={40} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Oops... {code} Error</h1>
        <p className="article-content text-muted-foreground max-w-md mx-auto">
          An error occurred. Please check your request and try again.
        </p>
        <Link
          href="/"
          className="btn outline-primary inline-flex items-center gap-2 mt-2 px-4 py-2 font-medium"
        >
          <Home size={16} />
          <span>Return Home</span>
        </Link>
      </div>
    </article>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div className="loading">Loading error details...</div>}>
      <ErrorContent />
    </Suspense>
  );
}

