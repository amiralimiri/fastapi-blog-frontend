import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <article className="content-section article-card text-center py-12">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="p-4 rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
          <AlertCircle size={48} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">404 - Page Not Found</h1>
        <p className="article-content max-w-md mx-auto text-muted-foreground">
          Sorry, the page or post you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/"
          className="btn primary inline-flex items-center gap-2 mt-2 px-5 py-2.5 font-medium"
        >
          <Home size={18} />
          <span>Back to Home</span>
        </Link>
      </div>
    </article>
  );
}
