"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { backend } from "@/lib/backend";
import type { NormalizedPaginatedPosts, NormalizedUser } from "@/lib/backend";
import { Loader2, RefreshCw, FileText, ArrowLeft } from "lucide-react";

export default function UserPosts() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<NormalizedUser | null>(null);
  const [data, setData] = useState<NormalizedPaginatedPosts | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const limit = 10;

  const loadInitial = useCallback(async () => {
    setError("");
    setInitialLoading(true);
    try {
      const [userData, d] = await Promise.all([
        backend.users.getUserById(userId),
        backend.posts.getUserPosts(userId, { skip: 0, limit }),
      ]);
      setUser(userData);
      setData(d);
      setOffset(d.posts.length);
    } catch {
      setError(
        "Unable to load this user's posts. Please check your connection and try again."
      );
    } finally {
      setInitialLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInitial();
  }, [loadInitial]);

  async function more() {
    setLoading(true);
    setError("");
    try {
      const d = await backend.posts.getUserPosts(userId, { skip: offset, limit });
      setData((prev) =>
        prev ? { ...d, posts: [...prev.posts, ...d.posts] } : d
      );
      setOffset(offset + d.posts.length);
    } catch {
      setError("Unable to load more posts. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="space-y-4 py-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-6" />
        {[1, 2].map((i) => (
          <article key={i} className="content-section article-card">
            <div className="article-layout">
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="article-main flex-1 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (!user || !data) {
    return (
      <div className="content-section article-card text-center py-12">
        <p className="error-text mb-4">{error || "Unable to load user profile."}</p>
        <button
          className="btn outline-primary inline-flex items-center gap-2"
          onClick={loadInitial}
          disabled={initialLoading}
        >
          <RefreshCw size={16} className={initialLoading ? "animate-spin" : ""} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <title>{`${user.username}'s Posts | FastAPI Blog`}</title>
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm font-medium inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to all posts</span>
        </Link>
      </div>

      <div className="content-section p-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-steel text-white flex items-center justify-center font-bold text-lg">
            {user.username.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold m-0 leading-tight">
              Posts by {user.username}
            </h1>
            <p className="text-sm text-muted-foreground m-0 mt-0.5">
              Total published posts: {data.total}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="content-section form-section flex items-center justify-between mb-4">
          <p className="error-text m-0">{error}</p>
          <button
            className="btn outline-primary text-sm inline-flex items-center gap-1.5"
            onClick={more}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Retry</span>
          </button>
        </div>
      )}

      <div>
        {data.posts.length ? (
          data.posts.map((p) => <PostCard key={p.id} post={p} />)
        ) : (
          <div className="content-section article-card text-center py-12">
            <FileText size={48} className="mx-auto text-muted-foreground opacity-50 mb-3" />
            <h3 className="text-lg font-semibold mb-1">No posts yet</h3>
            <p className="text-muted-foreground text-sm">
              This user hasn&apos;t published any articles yet.
            </p>
          </div>
        )}
      </div>

      {data.has_more && (
        <div className="load-more flex justify-center mt-6">
          <button
            className="btn outline-primary inline-flex items-center gap-2 px-6 py-2.5 font-medium"
            disabled={loading}
            onClick={more}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Load More Posts</span>
            )}
          </button>
        </div>
      )}
    </>
  );
}
