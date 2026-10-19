"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { backend, BackendError } from "@/lib/backend";
import type { BackendAdapter, NormalizedUser } from "@/lib/backend";
import { Loader2, RefreshCw, FileText, ArrowLeft } from "lucide-react";
import { useFeed } from "@/lib/feed";

function extractErrorMessage(err: unknown, fallbackMessage: string): string {
  if (err instanceof BackendError && err.status !== 0 && err.message) {
    return err.message;
  }
  return fallbackMessage;
}

interface UserPostsProps {
  adapter?: BackendAdapter;
}

export default function UserPosts({ adapter }: UserPostsProps = {}) {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId;
  const currentAdapter = adapter ?? backend;

  const [user, setUser] = useState<NormalizedUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [prevUserId, setPrevUserId] = useState(userId);

  if (prevUserId !== userId) {
    setPrevUserId(userId);
    setUser(null);
    setUserError(null);
  }

  const {
    posts,
    total,
    initialLoading,
    loadingMore,
    error: feedError,
    hasMore,
    loadMore,
    refresh,
  } = useFeed({ userId, adapter: currentAdapter });

  const loadUser = useCallback(async () => {
    if (!userId) return;
    setUserLoading(true);
    setUserError(null);
    try {
      const userData = await currentAdapter.users.getUserById(userId);
      setUser(userData);
    } catch (err) {
      setUserError(
        extractErrorMessage(
          err,
          "Unable to load this user's posts. Please check your connection and try again."
        )
      );
    } finally {
      setUserLoading(false);
    }
  }, [userId, currentAdapter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUser();
  }, [loadUser]);

  const handleRetry = useCallback(async () => {
    await Promise.all([
      !user ? loadUser() : Promise.resolve(),
      refresh(),
    ]);
  }, [user, loadUser, refresh]);

  const isInitialLoading =
    (userLoading || initialLoading) && (!user || posts.length === 0);

  if (isInitialLoading && !userError && !feedError) {
    return (
      <div className="space-y-4 py-4 animate-pulse" data-testid="user-posts-skeleton">
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

  if (!user || (feedError && posts.length === 0)) {
    const errorMessage =
      userError || feedError || "Unable to load user profile.";
    const isRetrying = userLoading || initialLoading;

    return (
      <div className="content-section article-card text-center py-12">
        <p className="error-text mb-4">{errorMessage}</p>
        <button
          className="btn outline-primary inline-flex items-center gap-2"
          onClick={() => void handleRetry()}
          disabled={isRetrying}
        >
          <RefreshCw
            size={16}
            className={isRetrying ? "animate-spin" : ""}
          />
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
              Total published posts: {total}
            </p>
          </div>
        </div>
      </div>

      {feedError && (
        <div className="content-section form-section flex items-center justify-between mb-4">
          <p className="error-text m-0">{feedError}</p>
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

      <div>
        {posts.length ? (
          posts.map((p) => <PostCard key={p.id} post={p} />)
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

      {hasMore && (
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
