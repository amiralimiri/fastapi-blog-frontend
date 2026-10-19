import type { FeedSubscriber, InvalidationFilter } from "./types";

const subscribers = new Set<FeedSubscriber>();

/**
 * Subscribes a feed callback to invalidation events.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeFeed(subscriber: FeedSubscriber): () => void {
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
}

/**
 * Triggers re-fetch across registered feeds matching the invalidation filter.
 * - If filter is omitted or empty (targetUserId is undefined), all feeds are refreshed.
 * - If filter.userId is provided, global feeds (userId === undefined) and matching user feeds are refreshed.
 */
export function invalidateFeed(filter?: InvalidationFilter): void {
  const targetUserId = filter?.userId;
  const snapshot = Array.from(subscribers);

  for (const subscriber of snapshot) {
    if (targetUserId === undefined) {
      try {
        void subscriber.callback();
      } catch (err) {
        console.error("Error running feed invalidation callback:", err);
      }
    } else {
      const isGlobalFeed = subscriber.userId === undefined;
      const isMatchingUser = String(subscriber.userId) === String(targetUserId);

      if (isGlobalFeed || isMatchingUser) {
        try {
          void subscriber.callback();
        } catch (err) {
          console.error("Error running feed invalidation callback:", err);
        }
      }
    }
  }
}

/**
 * Clears all active feed subscriptions. Useful for resetting test state.
 */
export function clearFeedSubscribers(): void {
  subscribers.clear();
}
