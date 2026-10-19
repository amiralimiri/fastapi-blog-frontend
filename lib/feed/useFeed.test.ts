import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFeed, invalidateFeed, subscribeFeed, clearFeedSubscribers } from "./index";
import { backend, BackendError } from "@/lib/backend";
import type { BackendAdapter, NormalizedPaginatedPosts, NormalizedPost } from "@/lib/backend";

function createMockPost(id: number, userId: number, title: string, content: string, username: string): NormalizedPost {
  return {
    id,
    user_id: userId,
    title,
    content,
    date_posted: "2026-04-01T12:00:00Z",
    author: {
      id: userId,
      username,
      email: `${username}@example.com`,
      avatarUrl: "/static/default.jpg",
      image_path: "/static/default.jpg",
    },
  };
}

function createPaginatedResponse(
  posts: NormalizedPost[],
  total: number,
  has_more: boolean,
  skip = 0,
  limit = 10
): NormalizedPaginatedPosts {
  return {
    posts,
    total,
    skip,
    limit,
    has_more,
  };
}

function createMockAdapter(overrides?: {
  getPosts?: ReturnType<typeof vi.fn>;
  getUserPosts?: ReturnType<typeof vi.fn>;
}): BackendAdapter {
  return {
    getToken: vi.fn(() => null),
    setToken: vi.fn(),
    clearToken: vi.fn(),
    onUnauthorized: vi.fn(() => () => {}),
    posts: {
      getPosts: overrides?.getPosts ?? vi.fn(),
      getPostById: vi.fn(),
      getUserPosts: overrides?.getUserPosts ?? vi.fn(),
      createPost: vi.fn(),
      updatePost: vi.fn(),
      deletePost: vi.fn(),
    },
    users: {
      getCurrentUser: vi.fn(),
      getUserById: vi.fn(),
      updateProfile: vi.fn(),
      uploadProfilePicture: vi.fn(),
      changePassword: vi.fn(),
      deleteAccount: vi.fn(),
    },
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    },
  };
}

describe("Feed Module (useFeed and Invalidation Registry)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFeedSubscribers();
  });

  describe("1. Initial Data Fetching & State Calculation", () => {
    it("fetches page 1 posts, populates data, and calculates total and hasMore correctly", async () => {
      const mockPosts = [
        createMockPost(1, 10, "Post 1", "Content 1", "author1"),
        createMockPost(2, 10, "Post 2", "Content 2", "author1"),
      ];
      const pageResponse = createPaginatedResponse(mockPosts, 5, true);

      const mockAdapter = createMockAdapter({
        getPosts: vi.fn().mockResolvedValue(pageResponse),
      });

      const { result } = renderHook(() =>
        useFeed({ adapter: mockAdapter, limit: 2 })
      );

      // Verify loading state before resolve
      expect(result.current.initialLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.initialLoading).toBe(false);
      });

      expect(mockAdapter.posts.getPosts).toHaveBeenCalledWith({ skip: 0, limit: 2 });
      expect(result.current.posts).toHaveLength(2);
      expect(result.current.posts[0].title).toBe("Post 1");
      expect(result.current.total).toBe(5);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.loadingMore).toBe(false);
    });

    it("fetches user-scoped posts when userId is provided", async () => {
      const mockPosts = [createMockPost(10, 42, "User Post", "User Content", "specificuser")];
      const pageResponse = createPaginatedResponse(mockPosts, 1, false);

      const mockAdapter = createMockAdapter({
        getUserPosts: vi.fn().mockResolvedValue(pageResponse),
      });

      const { result } = renderHook(() =>
        useFeed({ userId: 42, adapter: mockAdapter })
      );

      await waitFor(() => {
        expect(result.current.initialLoading).toBe(false);
      });

      expect(mockAdapter.posts.getUserPosts).toHaveBeenCalledWith(42, { skip: 0, limit: 10 });
      expect(result.current.posts).toHaveLength(1);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.total).toBe(1);
    });

    it("falls back to default backend singleton when adapter option is omitted", async () => {
      const mockPosts = [createMockPost(1, 1, "Default Adapter Post", "Content", "user1")];
      const spy = vi.spyOn(backend.posts, "getPosts").mockResolvedValueOnce(
        createPaginatedResponse(mockPosts, 1, false)
      );

      const { result } = renderHook(() => useFeed());

      await waitFor(() => {
        expect(result.current.initialLoading).toBe(false);
      });

      expect(spy).toHaveBeenCalledWith({ skip: 0, limit: 10 });
      expect(result.current.posts).toHaveLength(1);
      expect(result.current.posts[0].title).toBe("Default Adapter Post");
    });
  });

  describe("2. Sequential Cursor Pagination (loadMore)", () => {
    it("appends subsequent pages sequentially, updates offset and cursor arithmetic", async () => {
      const page1Posts = [createMockPost(1, 1, "P1", "C1", "user1")];
      const page2Posts = [createMockPost(2, 1, "P2", "C2", "user1")];
      const page3Posts = [createMockPost(3, 1, "P3", "C3", "user1")];

      const getPostsMock = vi
        .fn()
        .mockResolvedValueOnce(createPaginatedResponse(page1Posts, 3, true, 0, 1))
        .mockResolvedValueOnce(createPaginatedResponse(page2Posts, 3, true, 1, 1))
        .mockResolvedValueOnce(createPaginatedResponse(page3Posts, 3, false, 2, 1));

      const mockAdapter = createMockAdapter({ getPosts: getPostsMock });

      const { result } = renderHook(() =>
        useFeed({ adapter: mockAdapter, limit: 1 })
      );

      await waitFor(() => {
        expect(result.current.initialLoading).toBe(false);
      });

      expect(result.current.posts).toHaveLength(1);
      expect(result.current.hasMore).toBe(true);
      expect(getPostsMock).toHaveBeenLastCalledWith({ skip: 0, limit: 1 });

      // Load second page
      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.posts).toHaveLength(2);
      expect(result.current.posts[1].title).toBe("P2");
      expect(result.current.hasMore).toBe(true);
      expect(getPostsMock).toHaveBeenLastCalledWith({ skip: 1, limit: 1 });

      // Load third page (final)
      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.posts).toHaveLength(3);
      expect(result.current.posts[2].title).toBe("P3");
      expect(result.current.hasMore).toBe(false);
      expect(getPostsMock).toHaveBeenLastCalledWith({ skip: 2, limit: 1 });

      // Calling loadMore when hasMore is false should not trigger another request
      await act(async () => {
        await result.current.loadMore();
      });
      expect(getPostsMock).toHaveBeenCalledTimes(3);
    });
  });

  describe("3. Network Failure & Recovery on Initial Load", () => {
    it("exposes error on initial fetch failure and recovers cleanly upon refresh()", async () => {
      const successPosts = [createMockPost(1, 1, "Recovered Post", "Content", "user1")];
      const getPostsMock = vi
        .fn()
        .mockRejectedValueOnce(new BackendError(0, "Network failed"))
        .mockResolvedValueOnce(createPaginatedResponse(successPosts, 1, false));

      const mockAdapter = createMockAdapter({ getPosts: getPostsMock });

      const { result } = renderHook(() => useFeed({ adapter: mockAdapter }));

      await waitFor(() => {
        expect(result.current.initialLoading).toBe(false);
      });

      expect(result.current.error).toBe("Unable to load posts. Please check your connection and try again.");
      expect(result.current.posts).toHaveLength(0);

      // Trigger recovery via refresh()
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.posts).toHaveLength(1);
      expect(result.current.posts[0].title).toBe("Recovered Post");
      expect(getPostsMock).toHaveBeenCalledTimes(2);
    });

    it("surfaces structured BackendError status message if non-zero status is returned", async () => {
      const getPostsMock = vi
        .fn()
        .mockRejectedValueOnce(new BackendError(403, "Access restricted to members"));

      const mockAdapter = createMockAdapter({ getPosts: getPostsMock });
      const { result } = renderHook(() => useFeed({ adapter: mockAdapter }));

      await waitFor(() => {
        expect(result.current.initialLoading).toBe(false);
      });

      expect(result.current.error).toBe("Access restricted to members");
    });
  });

  describe("4. Network Failure & Recovery During Pagination", () => {
    it("exposes error on loadMore() without clearing existing posts and allows retry", async () => {
      const page1 = [createMockPost(1, 1, "Existing Post", "Content", "user1")];
      const page2 = [createMockPost(2, 1, "Subsequent Post", "Content", "user1")];

      const getPostsMock = vi
        .fn()
        .mockResolvedValueOnce(createPaginatedResponse(page1, 2, true, 0, 1))
        .mockRejectedValueOnce(new BackendError(0, "Network timeout"))
        .mockResolvedValueOnce(createPaginatedResponse(page2, 2, false, 1, 1));

      const mockAdapter = createMockAdapter({ getPosts: getPostsMock });
      const { result } = renderHook(() => useFeed({ adapter: mockAdapter, limit: 1 }));

      await waitFor(() => {
        expect(result.current.initialLoading).toBe(false);
      });

      expect(result.current.posts).toHaveLength(1);

      // Attempt to load more (fails)
      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.error).toBe("Unable to load more posts. Please try again.");
      expect(result.current.posts).toHaveLength(1);
      expect(result.current.posts[0].title).toBe("Existing Post");
      expect(result.current.loadingMore).toBe(false);

      // Retry loadMore()
      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.posts).toHaveLength(2);
      expect(result.current.posts[1].title).toBe("Subsequent Post");
    });
  });

  describe("5. Multi-field Search Query Filtering", () => {
    it("filters posts across title, content, and author username", async () => {
      const samplePosts = [
        createMockPost(1, 10, "React Design Patterns", "Deep dive into clean architecture", "alice"),
        createMockPost(2, 20, "Frontend State", "Exploring zustand and react hooks", "bob"),
        createMockPost(3, 30, "Tailwind Tricks", "Styling modern web apps", "charlie"),
      ];

      const mockAdapter = createMockAdapter({
        getPosts: vi.fn().mockResolvedValue(createPaginatedResponse(samplePosts, 3, false)),
      });

      // Initially no search query
      const { result, rerender } = renderHook(
        (props: { searchQuery?: string }) =>
          useFeed({ adapter: mockAdapter, searchQuery: props.searchQuery }),
        { initialProps: { searchQuery: "" } }
      );

      await waitFor(() => {
        expect(result.current.initialLoading).toBe(false);
      });
      expect(result.current.posts).toHaveLength(3);

      // Filter by title
      rerender({ searchQuery: "Design" });
      expect(result.current.posts).toHaveLength(1);
      expect(result.current.posts[0].title).toBe("React Design Patterns");

      // Filter by content (case-insensitive & trimmed)
      rerender({ searchQuery: "   zUsTanD  " });
      expect(result.current.posts).toHaveLength(1);
      expect(result.current.posts[0].title).toBe("Frontend State");

      // Filter by author username
      rerender({ searchQuery: "charlie" });
      expect(result.current.posts).toHaveLength(1);
      expect(result.current.posts[0].author.username).toBe("charlie");

      // Clear search restores all loaded posts immediately without backend request
      rerender({ searchQuery: "" });
      expect(result.current.posts).toHaveLength(3);

      // Non-matching query returns empty array
      rerender({ searchQuery: "xyznonexistent" });
      expect(result.current.posts).toHaveLength(0);
    });
  });

  describe("6. Invalidation Registry & Lifecycle Subscription", () => {
    it("triggers active subscribers to refresh from offset 0 when invalidateFeed() is called", async () => {
      const initialPosts = [createMockPost(1, 1, "Initial Post", "Initial Content", "user1")];
      const updatedPosts = [
        createMockPost(2, 1, "New Post", "New Content", "user1"),
        createMockPost(1, 1, "Initial Post", "Initial Content", "user1"),
      ];

      const getPostsMock = vi
        .fn()
        .mockResolvedValueOnce(createPaginatedResponse(initialPosts, 1, false))
        .mockResolvedValueOnce(createPaginatedResponse(updatedPosts, 2, false));

      const mockAdapter = createMockAdapter({ getPosts: getPostsMock });

      const { result } = renderHook(() => useFeed({ adapter: mockAdapter }));

      await waitFor(() => {
        expect(result.current.initialLoading).toBe(false);
      });
      expect(result.current.posts).toHaveLength(1);
      expect(result.current.posts[0].title).toBe("Initial Post");

      // Global invalidation triggers hook to refresh from offset 0
      await act(async () => {
        invalidateFeed();
      });

      await waitFor(() => {
        expect(result.current.posts).toHaveLength(2);
      });
      expect(result.current.posts[0].title).toBe("New Post");
      expect(getPostsMock).toHaveBeenLastCalledWith({ skip: 0, limit: 10 });
    });

    it("unsubscribes on unmount and does not trigger unmounted feeds", async () => {
      const getPostsMock = vi
        .fn()
        .mockResolvedValue(createPaginatedResponse([], 0, false));

      const mockAdapter = createMockAdapter({ getPosts: getPostsMock });
      const { unmount } = renderHook(() => useFeed({ adapter: mockAdapter }));

      await waitFor(() => {
        expect(getPostsMock).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Calling invalidateFeed should not trigger the unmounted hook
      await act(async () => {
        invalidateFeed();
      });

      expect(getPostsMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("7. Targeted Invalidation Filter", () => {
    it("calling invalidateFeed({ userId }) refreshes matching user feed and global feed, but not disjoint feeds", async () => {
      const globalMock = vi.fn().mockResolvedValue(createPaginatedResponse([], 0, false));
      const user1Mock = vi.fn().mockResolvedValue(createPaginatedResponse([], 0, false));
      const user2Mock = vi.fn().mockResolvedValue(createPaginatedResponse([], 0, false));

      const adapter1 = createMockAdapter({ getPosts: globalMock });
      const adapter2 = createMockAdapter({ getUserPosts: user1Mock });
      const adapter3 = createMockAdapter({ getUserPosts: user2Mock });

      // Render 3 feeds: 1 global, 1 for user 10, 1 for user 20
      const { result: globalResult } = renderHook(() => useFeed({ adapter: adapter1 }));
      const { result: user1Result } = renderHook(() => useFeed({ userId: 10, adapter: adapter2 }));
      const { result: user2Result } = renderHook(() => useFeed({ userId: 20, adapter: adapter3 }));

      await waitFor(() => {
        expect(globalResult.current.initialLoading).toBe(false);
        expect(user1Result.current.initialLoading).toBe(false);
        expect(user2Result.current.initialLoading).toBe(false);
      });

      expect(globalMock).toHaveBeenCalledTimes(1);
      expect(user1Mock).toHaveBeenCalledTimes(1);
      expect(user2Mock).toHaveBeenCalledTimes(1);

      // Invalidate specifically user 10
      await act(async () => {
        invalidateFeed({ userId: 10 });
      });

      await waitFor(() => {
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(user1Mock).toHaveBeenCalledTimes(2);
      });

      // User 20 must NOT have been called again
      expect(user2Mock).toHaveBeenCalledTimes(1);

      // Also verify string/number compatibility: invalidateFeed({ userId: "20" })
      await act(async () => {
        invalidateFeed({ userId: "20" });
      });

      await waitFor(() => {
        expect(globalMock).toHaveBeenCalledTimes(3);
        expect(user2Mock).toHaveBeenCalledTimes(2);
      });

      // User 10 should remain at 2
      expect(user1Mock).toHaveBeenCalledTimes(2);
    });
  });

  describe("8. Direct Invalidation Registry API", () => {
    it("supports direct subscription and unsubscription", () => {
      const cb = vi.fn();
      const unsubscribe = subscribeFeed({ callback: cb });

      invalidateFeed();
      expect(cb).toHaveBeenCalledTimes(1);

      unsubscribe();
      invalidateFeed();
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe("9. User ID Parameter Transitions", () => {
    it("resets posts and fetches new data when userId prop changes", async () => {
      const user1Posts = [createMockPost(1, 1, "User 1 Post", "Content", "user1")];
      const user2Posts = [createMockPost(2, 2, "User 2 Post", "Content", "user2")];

      const getUserPostsMock = vi
        .fn()
        .mockImplementation(async (uid: string | number) => {
          if (String(uid) === "1") {
            return createPaginatedResponse(user1Posts, 1, false);
          }
          return createPaginatedResponse(user2Posts, 1, false);
        });

      const mockAdapter = createMockAdapter({ getUserPosts: getUserPostsMock });

      const { result, rerender } = renderHook(
        (props: { userId: number }) => useFeed({ userId: props.userId, adapter: mockAdapter }),
        { initialProps: { userId: 1 } }
      );

      await waitFor(() => {
        expect(result.current.posts[0]?.title).toBe("User 1 Post");
      });

      rerender({ userId: 2 });

      await waitFor(() => {
        expect(result.current.posts[0]?.title).toBe("User 2 Post");
      });

      expect(getUserPostsMock).toHaveBeenCalledWith(1, { skip: 0, limit: 10 });
      expect(getUserPostsMock).toHaveBeenCalledWith(2, { skip: 0, limit: 10 });
    });
  });
});
