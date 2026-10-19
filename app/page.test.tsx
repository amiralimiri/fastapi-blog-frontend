import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "./page";
import { backend, BackendError } from "@/lib/backend";
import { invalidateFeed } from "@/lib/feed";
import type { NormalizedPaginatedPosts } from "@/lib/backend";

const mockPostsResponse: NormalizedPaginatedPosts = {
  posts: [
    {
      id: 1,
      user_id: 1,
      title: "First Post Title",
      content: "First post content preview text.",
      date_posted: "2026-04-01T10:00:00Z",
      author: {
        id: 1,
        username: "author1",
        email: "author1@example.com",
        avatarUrl: "/static/default.jpg",
        image_path: "/static/default.jpg",
      },
    },
    {
      id: 2,
      user_id: 2,
      title: "Second Post Title",
      content: "Second post content preview text.",
      date_posted: "2026-04-02T11:00:00Z",
      author: {
        id: 2,
        username: "author2",
        email: "author2@example.com",
        avatarUrl: "/static/default.jpg",
        image_path: "/static/default.jpg",
      },
    },
  ],
  total: 2,
  skip: 0,
  limit: 10,
  has_more: false,
};

describe("app/page (HomePage)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("displays initial pulse skeleton during initial load before request resolves", async () => {
    let resolvePosts: (value: NormalizedPaginatedPosts) => void = () => {};
    const pendingPromise = new Promise<NormalizedPaginatedPosts>((resolve) => {
      resolvePosts = resolve;
    });

    vi.spyOn(backend.posts, "getPosts").mockReturnValueOnce(pendingPromise);

    render(<HomePage />);

    expect(screen.getByTestId("feed-skeleton")).toBeInTheDocument();

    resolvePosts(mockPostsResponse);

    await waitFor(() => {
      expect(screen.queryByTestId("feed-skeleton")).not.toBeInTheDocument();
      expect(screen.getByText("First Post Title")).toBeInTheDocument();
    });
  });

  it("fetches and renders list of posts", async () => {
    vi.spyOn(backend.posts, "getPosts").mockResolvedValueOnce(mockPostsResponse);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("First Post Title")).toBeInTheDocument();
      expect(screen.getByText("Second Post Title")).toBeInTheDocument();
    });

    expect(backend.posts.getPosts).toHaveBeenCalledWith({ skip: 0, limit: 10 });
    expect(screen.getByText("author1")).toBeInTheDocument();
    expect(screen.getByText("author2")).toBeInTheDocument();
  });

  it("renders empty state when there are no posts", async () => {
    vi.spyOn(backend.posts, "getPosts").mockResolvedValueOnce({
      posts: [],
      total: 0,
      skip: 0,
      limit: 10,
      has_more: false,
    });

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("No posts yet")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Be the first to share an article with the community!")
    ).toBeInTheDocument();
  });

  it("handles fetch failure and allows retrying", async () => {
    const postsSpy = vi.spyOn(backend.posts, "getPosts")
      .mockRejectedValueOnce(new BackendError(0, "Network failed"))
      .mockResolvedValueOnce(mockPostsResponse);

    render(<HomePage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Unable to load posts/i)
      ).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("First Post Title")).toBeInTheDocument();
    });
    expect(postsSpy).toHaveBeenCalledTimes(2);
  });

  it("shows Load More button when has_more is true, reflects loading spinner while pending, and appends posts", async () => {
    const page1: NormalizedPaginatedPosts = {
      posts: [mockPostsResponse.posts[0]],
      total: 2,
      skip: 0,
      limit: 1,
      has_more: true,
    };

    let resolvePage2: (value: NormalizedPaginatedPosts) => void = () => {};
    const page2Promise = new Promise<NormalizedPaginatedPosts>((resolve) => {
      resolvePage2 = resolve;
    });

    vi.spyOn(backend.posts, "getPosts")
      .mockResolvedValueOnce(page1)
      .mockReturnValueOnce(page2Promise);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("First Post Title")).toBeInTheDocument();
    });
    const loadMoreBtn = screen.getByRole("button", { name: /Load More Posts/i });
    expect(loadMoreBtn).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(loadMoreBtn);

    // Verify loading spinner & disabled state during pagination
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Loading\.\.\./i })).toBeDisabled();
    });

    resolvePage2({
      posts: [mockPostsResponse.posts[1]],
      total: 2,
      skip: 1,
      limit: 1,
      has_more: false,
    });

    await waitFor(() => {
      expect(screen.getByText("Second Post Title")).toBeInTheDocument();
    });
    expect(backend.posts.getPosts).toHaveBeenLastCalledWith({ skip: 1, limit: 10 });
    expect(screen.queryByRole("button", { name: /Load More Posts/i })).not.toBeInTheDocument();
  });

  it("handles incremental pagination failure, shows retry banner, and recovers on retry", async () => {
    const page1: NormalizedPaginatedPosts = {
      posts: [mockPostsResponse.posts[0]],
      total: 2,
      skip: 0,
      limit: 1,
      has_more: true,
    };
    const page2: NormalizedPaginatedPosts = {
      posts: [mockPostsResponse.posts[1]],
      total: 2,
      skip: 1,
      limit: 1,
      has_more: false,
    };

    vi.spyOn(backend.posts, "getPosts")
      .mockResolvedValueOnce(page1)
      .mockRejectedValueOnce(new BackendError(0, "Network timeout during pagination"))
      .mockResolvedValueOnce(page2);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("First Post Title")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Load More Posts/i }));

    await waitFor(() => {
      expect(screen.getByText("Unable to load more posts. Please try again.")).toBeInTheDocument();
    });

    // Existing posts remain visible
    expect(screen.getByText("First Post Title")).toBeInTheDocument();

    // Click retry on pagination error banner
    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Second Post Title")).toBeInTheDocument();
    });

    expect(screen.queryByText("Unable to load more posts. Please try again.")).not.toBeInTheDocument();
  });

  it("filters posts by title, content, and author in search box, and clears search", async () => {
    vi.spyOn(backend.posts, "getPosts").mockResolvedValueOnce(mockPostsResponse);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("First Post Title")).toBeInTheDocument();
      expect(screen.getByText("Second Post Title")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/Search posts by title/i);

    // Search by author
    await user.type(searchInput, "author2");
    expect(screen.queryByText("First Post Title")).not.toBeInTheDocument();
    expect(screen.getByText("Second Post Title")).toBeInTheDocument();

    // Clear search using clear button
    const clearBtn = screen.getByRole("button", { name: /Clear search/i });
    await user.click(clearBtn);

    expect(screen.getByText("First Post Title")).toBeInTheDocument();
    expect(screen.getByText("Second Post Title")).toBeInTheDocument();
  });

  it("shows empty search state when query does not match any posts", async () => {
    vi.spyOn(backend.posts, "getPosts").mockResolvedValueOnce(mockPostsResponse);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("First Post Title")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/Search posts by title/i);
    await user.type(searchInput, "NonExistentKeywordXYZ");

    expect(screen.getByText("No matching posts found")).toBeInTheDocument();
    expect(
      screen.getByText(/Try adjusting your search query/i)
    ).toBeInTheDocument();
  });

  it("refreshes posts when invalidateFeed() is called", async () => {
    const updatedResponse: NormalizedPaginatedPosts = {
      posts: [
        {
          id: 3,
          user_id: 3,
          title: "Newly Published Post",
          content: "Brand new content",
          date_posted: "2026-04-03T12:00:00Z",
          author: {
            id: 3,
            username: "author3",
            email: "author3@example.com",
            avatarUrl: "/static/default.jpg",
            image_path: "/static/default.jpg",
          },
        },
      ],
      total: 1,
      skip: 0,
      limit: 10,
      has_more: false,
    };

    vi.spyOn(backend.posts, "getPosts")
      .mockResolvedValueOnce(mockPostsResponse)
      .mockResolvedValueOnce(updatedResponse);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("First Post Title")).toBeInTheDocument();
    });

    act(() => {
      invalidateFeed();
    });

    await waitFor(() => {
      expect(screen.getByText("Newly Published Post")).toBeInTheDocument();
    });
  });
});
