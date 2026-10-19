"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { backend, BackendError } from "@/lib/backend";
import type { NormalizedPost } from "@/lib/backend";
import { subscribeFeed } from "./invalidation";
import type { UseFeedOptions, UseFeedResult } from "./types";

function extractErrorMessage(err: unknown, fallbackMessage: string): string {
  if (err instanceof BackendError && err.status !== 0 && err.message) {
    return err.message;
  }
  return fallbackMessage;
}

export function useFeed(options: UseFeedOptions = {}): UseFeedResult {
  const { userId, searchQuery = "", limit = 10, adapter = backend } = options;

  const [rawPosts, setRawPosts] = useState<NormalizedPost[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [prevUserId, setPrevUserId] = useState(userId);

  if (prevUserId !== userId) {
    setPrevUserId(userId);
    setRawPosts([]);
    setTotal(0);
    setHasMore(false);
  }

  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const currentReqId = ++requestIdRef.current;
    setInitialLoading(true);
    setError(null);

    try {
      const data =
        userId !== undefined
          ? await adapter.posts.getUserPosts(userId, { skip: 0, limit })
          : await adapter.posts.getPosts({ skip: 0, limit });

      if (currentReqId === requestIdRef.current) {
        setRawPosts(data.posts);
        setTotal(data.total);
        setHasMore(data.has_more);
      }
    } catch (err) {
      if (currentReqId === requestIdRef.current) {
        setError(
          extractErrorMessage(
            err,
            "Unable to load posts. Please check your connection and try again."
          )
        );
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setInitialLoading(false);
      }
    }
  }, [userId, limit, adapter]);

  const loadMore = useCallback(async () => {
    if (loadingMore || initialLoading || !hasMore) {
      return;
    }

    const currentReqId = ++requestIdRef.current;
    setLoadingMore(true);
    setError(null);

    try {
      const skip = rawPosts.length;
      const data =
        userId !== undefined
          ? await adapter.posts.getUserPosts(userId, { skip, limit })
          : await adapter.posts.getPosts({ skip, limit });

      if (currentReqId === requestIdRef.current) {
        setRawPosts((prev) => [...prev, ...data.posts]);
        setTotal(data.total);
        setHasMore(data.has_more);
      }
    } catch (err) {
      if (currentReqId === requestIdRef.current) {
        setError(
          extractErrorMessage(
            err,
            "Unable to load more posts. Please try again."
          )
        );
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setLoadingMore(false);
      }
    }
  }, [loadingMore, initialLoading, hasMore, rawPosts.length, userId, limit, adapter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = subscribeFeed({
      userId,
      callback: () => {
        void refresh();
      },
    });
    return unsubscribe;
  }, [userId, refresh]);

  useEffect(() => {
    const reqRef = requestIdRef;
    return () => {
      reqRef.current++;
    };
  }, []);

  const posts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return rawPosts;
    }
    return rawPosts.filter((post) => {
      const titleMatch = post.title?.toLowerCase().includes(q) ?? false;
      const contentMatch = post.content?.toLowerCase().includes(q) ?? false;
      const usernameMatch =
        post.author?.username?.toLowerCase().includes(q) ?? false;
      return titleMatch || contentMatch || usernameMatch;
    });
  }, [rawPosts, searchQuery]);

  return {
    posts,
    total,
    initialLoading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
