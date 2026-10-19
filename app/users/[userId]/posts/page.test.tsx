import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPosts from "./page";
import { backend, BackendError } from "@/lib/backend";
import { invalidateFeed } from "@/lib/feed";
import type { NormalizedPaginatedPosts, NormalizedUser, BackendAdapter } from "@/lib/backend";

const mockAuthor: NormalizedUser = {
  id: 1,
  username: "johndoe",
  email: "john@example.com",
  avatarUrl: "/default.jpg",
  image_path: "/default.jpg",
};

const mockUserPosts: NormalizedPaginatedPosts = {
  posts: [
    {
      id: 10,
      user_id: 1,
      title: "Author First Post",
      content: "Content by author",
      date_posted: "2026-04-01T12:00:00Z",
      author: mockAuthor,
    },
  ],
  total: 1,
  skip: 0,
  limit: 10,
  has_more: false,
};

describe("app/users/[userId]/posts/page (UserPosts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("displays initial pulse skeleton during initial load before requests resolve", async () => {
    let resolveUser: (value: NormalizedUser) => void = () => {};
    const userPromise = new Promise<NormalizedUser>((resolve) => {
      resolveUser = resolve;
    });
    let resolvePosts: (value: NormalizedPaginatedPosts) => void = () => {};
    const postsPromise = new Promise<NormalizedPaginatedPosts>((resolve) => {
      resolvePosts = resolve;
    });

    vi.spyOn(backend.users, "getUserById").mockReturnValueOnce(userPromise);
    vi.spyOn(backend.posts, "getUserPosts").mockReturnValueOnce(postsPromise);

    render(<UserPosts />);

    expect(screen.getByTestId("user-posts-skeleton")).toBeInTheDocument();

    resolveUser(mockAuthor);
    resolvePosts(mockUserPosts);

    await waitFor(() => {
      expect(screen.queryByTestId("user-posts-skeleton")).not.toBeInTheDocument();
      expect(screen.getByText("Posts by johndoe")).toBeInTheDocument();
    });
  });

  it("fetches and renders user posts and author header", async () => {
    vi.spyOn(backend.users, "getUserById").mockResolvedValue(mockAuthor);
    vi.spyOn(backend.posts, "getUserPosts").mockResolvedValue(mockUserPosts);

    render(<UserPosts />);

    await waitFor(() => {
      expect(screen.getByText("Posts by johndoe")).toBeInTheDocument();
    });

    expect(screen.getByText("Author First Post")).toBeInTheDocument();
    expect(screen.getByText("Total published posts: 1")).toBeInTheDocument();
    expect(backend.users.getUserById).toHaveBeenCalledWith("1");
    expect(backend.posts.getUserPosts).toHaveBeenCalledWith("1", { skip: 0, limit: 10 });
  });

  it("renders empty state when user has no posts", async () => {
    vi.spyOn(backend.users, "getUserById").mockResolvedValue(mockAuthor);
    vi.spyOn(backend.posts, "getUserPosts").mockResolvedValue({
      posts: [],
      total: 0,
      skip: 0,
      limit: 10,
      has_more: false,
    });

    render(<UserPosts />);

    await waitFor(() => {
      expect(screen.getByText("No posts yet")).toBeInTheDocument();
    });

    expect(
      screen.getByText("This user hasn't published any articles yet.")
    ).toBeInTheDocument();
  });

  it("handles error and allows retrying", async () => {
    const userSpy = vi.spyOn(backend.users, "getUserById")
      .mockRejectedValue(new Error("Network failure"));

    vi.spyOn(backend.posts, "getUserPosts").mockResolvedValue(mockUserPosts);

    render(<UserPosts />);

    await waitFor(() => {
      expect(screen.getByText(/Unable to load this user's posts/i)).toBeInTheDocument();
    });

    userSpy.mockResolvedValue(mockAuthor);

    const user = userEvent.setup();
    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Posts by johndoe")).toBeInTheDocument();
    });
  });

  it("loads more posts using backend.posts.getUserPosts with offset", async () => {
    vi.spyOn(backend.users, "getUserById").mockResolvedValue(mockAuthor);
    const page1: NormalizedPaginatedPosts = {
      posts: [mockUserPosts.posts[0]],
      total: 2,
      skip: 0,
      limit: 10,
      has_more: true,
    };
    const page2: NormalizedPaginatedPosts = {
      posts: [
        {
          id: 11,
          user_id: 1,
          title: "Author Second Post",
          content: "More content by author",
          date_posted: "2026-04-02T12:00:00Z",
          author: mockAuthor,
        },
      ],
      total: 2,
      skip: 1,
      limit: 10,
      has_more: false,
    };

    let resolvePage2: (value: NormalizedPaginatedPosts) => void = () => {};
    const page2Promise = new Promise<NormalizedPaginatedPosts>((resolve) => {
      resolvePage2 = resolve;
    });

    vi.spyOn(backend.posts, "getUserPosts")
      .mockResolvedValueOnce(page1)
      .mockReturnValueOnce(page2Promise);

    render(<UserPosts />);

    await waitFor(() => {
      expect(screen.getByText("Author First Post")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const loadMoreBtn = screen.getByRole("button", { name: /Load More Posts/i });
    await user.click(loadMoreBtn);

    // Verify loading spinner & disabled state during pagination traversal
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Loading\.\.\./i })).toBeDisabled();
    });

    resolvePage2(page2);

    await waitFor(() => {
      expect(screen.getByText("Author Second Post")).toBeInTheDocument();
    });

    expect(backend.posts.getUserPosts).toHaveBeenLastCalledWith("1", { skip: 1, limit: 10 });
    expect(screen.queryByRole("button", { name: /Load More Posts/i })).not.toBeInTheDocument();
  });

  it("handles incremental pagination failure, displays retry notice, and recovers on retry", async () => {
    vi.spyOn(backend.users, "getUserById").mockResolvedValue(mockAuthor);
    const page1: NormalizedPaginatedPosts = {
      posts: [mockUserPosts.posts[0]],
      total: 2,
      skip: 0,
      limit: 10,
      has_more: true,
    };
    const page2: NormalizedPaginatedPosts = {
      posts: [
        {
          id: 11,
          user_id: 1,
          title: "Author Second Post",
          content: "More content by author",
          date_posted: "2026-04-02T12:00:00Z",
          author: mockAuthor,
        },
      ],
      total: 2,
      skip: 1,
      limit: 10,
      has_more: false,
    };

    vi.spyOn(backend.posts, "getUserPosts")
      .mockResolvedValueOnce(page1)
      .mockRejectedValueOnce(new BackendError(0, "Network timeout"))
      .mockResolvedValueOnce(page2);

    render(<UserPosts />);

    await waitFor(() => {
      expect(screen.getByText("Author First Post")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Load More Posts/i }));

    await waitFor(() => {
      expect(screen.getByText("Unable to load more posts. Please try again.")).toBeInTheDocument();
    });

    // Existing author post remains visible
    expect(screen.getByText("Author First Post")).toBeInTheDocument();

    // Click retry on inline error banner
    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Author Second Post")).toBeInTheDocument();
    });

    expect(screen.queryByText("Unable to load more posts. Please try again.")).not.toBeInTheDocument();
  });

  it("refreshes user feed when invalidateFeed is triggered for matching user or globally", async () => {
    vi.spyOn(backend.users, "getUserById").mockResolvedValue(mockAuthor);

    const updatedUserPosts: NormalizedPaginatedPosts = {
      posts: [
        {
          id: 12,
          user_id: 1,
          title: "Freshly Created User Post",
          content: "Brand new user content",
          date_posted: "2026-04-03T12:00:00Z",
          author: mockAuthor,
        },
      ],
      total: 1,
      skip: 0,
      limit: 10,
      has_more: false,
    };

    vi.spyOn(backend.posts, "getUserPosts")
      .mockResolvedValueOnce(mockUserPosts)
      .mockResolvedValueOnce(updatedUserPosts);

    render(<UserPosts />);

    await waitFor(() => {
      expect(screen.getByText("Author First Post")).toBeInTheDocument();
    });

    act(() => {
      invalidateFeed({ userId: "1" });
    });

    await waitFor(() => {
      expect(screen.getByText("Freshly Created User Post")).toBeInTheDocument();
    });
  });

  it("does not refresh user feed when invalidateFeed is called for a different user", async () => {
    vi.spyOn(backend.users, "getUserById").mockResolvedValue(mockAuthor);
    vi.spyOn(backend.posts, "getUserPosts").mockResolvedValue(mockUserPosts);

    render(<UserPosts />);

    await waitFor(() => {
      expect(screen.getByText("Author First Post")).toBeInTheDocument();
    });

    act(() => {
      invalidateFeed({ userId: "999" });
    });

    // backend.posts.getUserPosts should only have been called once on mount
    expect(backend.posts.getUserPosts).toHaveBeenCalledTimes(1);
  });

  it("supports custom adapter injection", async () => {
    const customUser: NormalizedUser = {
      id: 2,
      username: "customuser",
      email: "custom@example.com",
      avatarUrl: "/custom.jpg",
      image_path: "/custom.jpg",
    };

    const customPosts: NormalizedPaginatedPosts = {
      posts: [
        {
          id: 20,
          user_id: 2,
          title: "Custom Adapter Post",
          content: "Custom adapter content",
          date_posted: "2026-04-01T12:00:00Z",
          author: customUser,
        },
      ],
      total: 1,
      skip: 0,
      limit: 10,
      has_more: false,
    };

    const mockCustomAdapter = {
      users: {
        getUserById: vi.fn().mockResolvedValue(customUser),
      },
      posts: {
        getUserPosts: vi.fn().mockResolvedValue(customPosts),
        getPosts: vi.fn(),
      },
    } as unknown as BackendAdapter;

    render(<UserPosts adapter={mockCustomAdapter} />);

    await waitFor(() => {
      expect(screen.getByText("Posts by customuser")).toBeInTheDocument();
      expect(screen.getByText("Custom Adapter Post")).toBeInTheDocument();
    });

    expect(mockCustomAdapter.users.getUserById).toHaveBeenCalledWith("1");
    expect(mockCustomAdapter.posts.getUserPosts).toHaveBeenCalledWith("1", { skip: 0, limit: 10 });
  });
});
