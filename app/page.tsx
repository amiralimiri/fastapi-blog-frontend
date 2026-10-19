"use client";

import { useState } from "react";
import { PostCard } from "@/components/PostCard";
import { Loader2, RefreshCw, FileText, Search, X } from "lucide-react";
import { useFeed } from "@/lib/feed";
import type { BackendAdapter } from "@/lib/backend";

interface HomePageProps {
  adapter?: BackendAdapter;
}

export default function HomePage({ adapter }: HomePageProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    posts,
    total,
    initialLoading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useFeed({ searchQuery, adapter });

  if (initialLoading && total === 0 && posts.length === 0) {
    return (
      <div className="space-y-4 py-4 animate-pulse" data-testid="feed-skeleton">
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

  if (error && total === 0 && posts.length === 0) {
    return (
      <div className="content-section article-card text-center py-12">
        <p className="error-text mb-4">{error}</p>
        <button
          className="btn outline-primary inline-flex items-center gap-2"
          onClick={() => void refresh()}
          disabled={initialLoading}
        >
          <RefreshCw size={16} className={initialLoading ? "animate-spin" : ""} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const hasPosts = total > 0 || posts.length > 0 || Boolean(searchQuery);

  return (
    <>
      {error && (
        <div className="content-section form-section flex items-center justify-between mb-4">
          <p className="error-text m-0">{error}</p>
          <button
            className="btn outline-primary text-sm inline-flex items-center gap-1.5"
            onClick={() => void loadMore()}
            disabled={loadingMore}
          >
            <RefreshCw size={14} className={loadingMore ? "animate-spin" : ""} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {hasPosts && (
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

      {!hasPosts ? (
        <div className="content-section article-card text-center py-12">
          <FileText size={48} className="mx-auto text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-xl font-semibold mb-1">No posts yet</h3>
          <p className="text-muted-foreground text-sm">
            Be the first to share an article with the community!
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div className="content-section article-card text-center py-12">
          <Search size={40} className="mx-auto text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold mb-1">No matching posts found</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your search query or clear it to view all posts.
          </p>
        </div>
      ) : (
        <div id="postsContainer">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      {hasMore && !searchQuery && (
        <div className="load-more flex justify-center mt-6">
          <button
            className="btn outline-primary inline-flex items-center gap-2 px-6 py-2.5 font-medium"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? (
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

