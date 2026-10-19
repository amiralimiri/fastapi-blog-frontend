"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { backend } from "@/lib/backend";
import { PostCard } from "@/components/PostCard";
import type { NormalizedPaginatedPosts } from "@/lib/backend";
import { Loader2, RefreshCw, FileText, Search, X } from "lucide-react";

export default function HomePage() {
  const [data, setData] = useState<NormalizedPaginatedPosts | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 10;

  const load = useCallback(async (skip: number, replace = false) => {
    setLoading(true);
    setError("");
    try {
      const d = await backend.posts.getPosts({ skip, limit });
      setData((prev) =>
        replace ? d : { ...d, posts: [...(prev?.posts || []), ...d.posts] }
      );
      setOffset(skip + d.posts.length);
    } catch {
      setError(
        "Unable to load posts. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load(0, true);

    const onPostsUpdated = () => {
      load(0, true);
    };
    window.addEventListener("postsUpdated", onPostsUpdated);
    return () => window.removeEventListener("postsUpdated", onPostsUpdated);
  }, [load]);

  const displayedPosts = useMemo(() => {
    if (!data?.posts) return [];
    if (!searchQuery.trim()) return data.posts;
    const q = searchQuery.toLowerCase().trim();
    return data.posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.author.username.toLowerCase().includes(q)
    );
  }, [data?.posts, searchQuery]);

  if (!data && loading) {
    return (
      <div className="space-y-4 py-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <article key={i} className="content-section article-card">
            <div className="article-layout">
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="article-main flex-1 space-y-3">
                <div className="flex gap-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" />
                </div>
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="content-section article-card text-center py-12">
        <p className="error-text mb-4">{error || "Unable to load posts."}</p>
        <button
          className="btn outline-primary inline-flex items-center gap-2"
          onClick={() => load(0, true)}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="content-section form-section flex items-center justify-between mb-4">
          <p className="error-text m-0">{error}</p>
          <button
            className="btn outline-primary text-sm inline-flex items-center gap-1.5"
            onClick={() => load(offset, false)}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {data.posts.length > 0 && (
        <div className="content-section p-3 mb-4 flex items-center gap-2.5">
          <Search size={18} className="text-muted-foreground shrink-0 ml-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts by title, content or author..."
            className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {data.posts.length === 0 ? (
        <div className="content-section article-card text-center py-12">
          <FileText size={48} className="mx-auto text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-xl font-semibold mb-1">No posts yet</h3>
          <p className="text-muted-foreground text-sm">
            Be the first to share an article with the community!
          </p>
        </div>
      ) : displayedPosts.length === 0 ? (
        <div className="content-section article-card text-center py-12">
          <Search size={40} className="mx-auto text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold mb-1">No matching posts found</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your search query or clear it to view all posts.
          </p>
        </div>
      ) : (
        <div id="postsContainer">
          {displayedPosts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      {data.has_more && !searchQuery && (
        <div className="load-more flex justify-center mt-6">
          <button
            className="btn outline-primary inline-flex items-center gap-2 px-6 py-2.5 font-medium"
            disabled={loading}
            onClick={() => load(offset)}
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

