Status: ready-for-agent

# Specification: Deep Feed State & Invalidation Module

## Problem Statement

Currently, post feed state management and post lifecycle invalidation are fragmented across the codebase. 

`HomePage` and `UserPosts` each maintain independent, duplicated pagination state machines—manually managing offsets, page accumulation, request loading flags, and error states. 

Furthermore, post mutation events (such as creating a post via `CreatePostModal` or deleting a post via `PostPage`) communicate across component seams via an untyped global browser DOM event bus (`window.dispatchEvent(new Event("postsUpdated"))`). `HomePage` subscribes to this window event, but `UserPosts` does not, causing cache desynchronization when navigating user profiles. In addition, client-side search filtering is manually repeated inside page views.

From a developer and user perspective, this causes:
1. Inconsistent data state when posts are created or deleted.
2. Fragile global event bus interactions tied to the browser `window` object.
3. Duplication of pagination cursor arithmetic and retry logic across multiple views.

## Solution

Collapse all post feed queries, cursor pagination, client-side search filtering, and cross-view cache invalidation into a single deep **Feed** module placed at an in-process hook seam (`useFeed` and `invalidateFeed`).

The module presents a compact, high-leverage interface to callers while hiding offset tracking, slice concatenation, search predicates, and a private subscriber registry inside its implementation. Mutations trigger keyed invalidation (`invalidateFeed({ userId })`), automatically re-fetching active feeds without raw window events or manual cache splicing.

## User Stories

1. As a reader browsing the home page, I want to see a paginated feed of all published posts, so that I can discover content across the platform.
2. As a reader browsing the home page, I want to see an initial loading skeleton during the first request, so that I have smooth visual feedback while data loads.
3. As a reader viewing a feed, I want to click "Load more" to paginate through subsequent posts, so that I can explore older entries without losing my current view.
4. As a reader viewing a feed, I want to see a loading indicator specifically on the "Load more" button while subsequent pages load, so that I know new posts are arriving.
5. As a reader viewing a feed, I want the "Load more" button to disappear when all posts have been loaded, so that I know I have reached the end of the feed.
6. As a reader experiencing a network interruption, I want to see an error notice with a retry button on the initial load, so that I can attempt to reload the feed when my connection recovers.
7. As a reader experiencing a failure during pagination, I want to see an inline error notice with a retry button on the pagination seam, so that I can retry loading the remaining posts without restarting from the top.
8. As a reader searching on the home page, I want to filter posts in real-time by title, content, or author username, so that I can quickly find relevant topics.
9. As a reader viewing a filtered search result, I want to clear my search query to immediately see all loaded posts again, so that I can resume general browsing.
10. As a reader visiting an author's profile, I want to see a feed strictly scoped to that User's authored posts, so that I can read all content by that specific author.
11. As an author publishing a new post via the creation modal, I want all active feeds to refresh immediately upon submission, so that my new post appears at the top of the feed without needing a browser reload.
12. As an author deleting a post from the post detail page, I want all active feeds to refresh immediately, so that the deleted post no longer appears in feeds.
13. As an author viewing my own user profile feed, I want my profile feed to automatically refresh when I publish or delete a post, so that my profile accurately reflects my current post count and list.
14. As a frontend developer, I want all feed pagination and invalidation logic to be encapsulated behind a single hook interface, so that pages do not duplicate offset arithmetic or array slicing.
15. As a frontend developer, I want cache invalidation to use a type-safe function rather than global `window` events, so that post state synchronization is reliable and testable without a DOM environment.
16. As a frontend developer, I want to inject a mock or fake backend adapter into the feed module during testing, so that feed behavior can be verified without brittle global fetch or module mocks.

## Implementation Decisions

### 1. Module Placement & Seam Structure
- The deepened module lives under `lib/feed/`:
  - `types.ts`: Interface definitions for query options, invalidation filters, and feed state.
  - `invalidation.ts`: Module-private subscriber registry and public `invalidateFeed(filter?: InvalidationFilter)` function.
  - `useFeed.ts`: Primary React hook encapsulating state, cursor tracking, client search filtering, and lifecycle subscriptions.
  - `index.ts`: Unified public export seam (`useFeed`, `invalidateFeed`, types).
- No global React Context wrapper (`FeedProvider`) is used. Placing the seam at the hook and in-process invalidation registry avoids unnecessary JSX provider nesting and maximizes depth.

### 2. Interface Contracts

The interface presented to callers:

```typescript
export interface InvalidationFilter {
  userId?: string | number;
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

export function invalidateFeed(filter?: InvalidationFilter): void;
```

### 3. Keyed Invalidation Registry
- An internal `Set<Subscriber>` in `invalidation.ts` tracks active hook instances.
- Each subscription registers its active scope (`userId?: string | number`) and a callback to trigger re-fetch.
- When `invalidateFeed(filter)` is called:
  - If `filter` is omitted or empty, all registered feeds are triggered to refresh.
  - If `filter.userId` is provided, both global feeds (where `userId` is undefined) and matching user-scoped feeds are triggered to refresh.
- Subscriptions are cleanly unregistered in `useFeed` cleanup effects to prevent memory leaks.

### 4. Search Filter Encapsulation
- When `searchQuery` is provided to `useFeed`, the module computes `displayedPosts` internally:
  - Trims and lowercases the query string.
  - Matches across `post.title`, `post.content`, and `post.author.username`.
- Callers read `posts` directly from `useFeed`, eliminating `useMemo` search duplication in `HomePage`.

### 5. Migration of Callers
- **`app/page.tsx`**:
  - Replace `load`, `offset`, `loading`, `error`, and `searchQuery` filtering state with `useFeed({ searchQuery })`.
  - Remove `window.addEventListener("postsUpdated", ...)` and its event cleanup.
- **`app/users/[userId]/posts/page.tsx`**:
  - Keep User metadata fetching (`backend.users.getUserById(userId)`).
  - Replace post list state machines, `more()` function, and offset tracking with `useFeed({ userId })`.
- **`components/CreatePostModal.tsx`**:
  - Replace `window.dispatchEvent(new Event("postsUpdated"))` with `invalidateFeed()`.
- **`app/posts/[postId]/page.tsx`**:
  - Replace `window.dispatchEvent(new Event("postsUpdated"))` with `invalidateFeed({ userId: post.author.id })`.

## Testing Decisions

### Test Boundary & Philosophy
- Tests will exercise the Feed module through its public interface (`useFeed` and `invalidateFeed`).
- Tests will verify external behavior and invariants: initial loading, data formatting, pagination accumulation, error recovery on retry, search filtering results, and cache invalidation upon mutation.
- Implementation details (internal state hooks, private registry arrays, raw offset math) will not be asserted directly.

### Prior Art
- `context/AuthContext.test.tsx` and `lib/backend/adapter.test.ts` demonstrate test patterns in this repository:
  - Injecting adapter mocks / fakes directly into the module.
  - Using `@testing-library/react`'s `renderHook` and `act` for hook lifecycle testing.

### Test Coverage Plan
- Dedicated unit test suite in `lib/feed/useFeed.test.ts`:
  1. Initial data fetching, page 1 posts population, `total` and `hasMore` calculations.
  2. Sequential `loadMore()` calls appending posts and updating offset state.
  3. Network failure during initial load exposing `error` and verifying `refresh()` recovers.
  4. Network failure during `loadMore()` exposing `error` without clearing existing posts.
  5. Live search query filtering across title, content, and author.
  6. Calling `invalidateFeed()` triggers active subscribers to refresh from offset 0.
  7. Targeted invalidation: calling `invalidateFeed({ userId })` updates matching user feed and global feed, but leaves disjoint user feeds un-triggered.
- Existing page integration tests (`app/page.test.tsx`, `app/users/[userId]/posts/page.test.tsx`, `components/CreatePostModal.test.tsx`, `app/posts/[postId]/page.test.tsx`) must all continue to pass.

## Out of Scope

1. Server Actions or Next.js Route Handlers (the external FastAPI backend is immutable; this refactor remains strictly within client-side module depth).
2. Optimistic local cache splicing (re-fetching on invalidation maintains exact synchronization with the backend).
3. Modifying external backend API endpoints or backend schemas.
4. Changing Avatar image presentation (covered separately in Candidate 2).

## Further Notes

- `GLOSSARY.md` has been updated with the formal definition of **Feed**.
- Removing `window.dispatchEvent` cleanses browser global leakage and makes testing reliable across Node/jsdom test environments.
