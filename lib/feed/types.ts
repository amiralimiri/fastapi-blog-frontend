import type { BackendAdapter, NormalizedPost } from "@/lib/backend";

export interface InvalidationFilter {
  userId?: string | number;
}

export type FeedSubscriberCallback = () => void | Promise<void>;

export interface FeedSubscriber {
  userId?: string | number;
  callback: FeedSubscriberCallback;
}

export interface UseFeedOptions {
  userId?: string | number;
  searchQuery?: string;
  limit?: number;
  adapter?: BackendAdapter;
}

export interface UseFeedResult {
  posts: NormalizedPost[];
  total: number;
  initialLoading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}
