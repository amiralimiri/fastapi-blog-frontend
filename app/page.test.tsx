import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "./page";
import { backend, BackendError } from "@/lib/backend";
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

  it("shows Load More button when has_more is true and appends posts", async () => {
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
      .mockResolvedValueOnce(page2);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("First Post Title")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Load More Posts/i })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Load More Posts/i }));

    await waitFor(() => {
      expect(screen.getByText("Second Post Title")).toBeInTheDocument();
    });
    expect(backend.posts.getPosts).toHaveBeenLastCalledWith({ skip: 1, limit: 10 });
    expect(screen.queryByRole("button", { name: /Load More Posts/i })).not.toBeInTheDocument();
  });

  it("filters posts by title in search box", async () => {
    vi.spyOn(backend.posts, "getPosts").mockResolvedValueOnce(mockPostsResponse);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("First Post Title")).toBeInTheDocument();
      expect(screen.getByText("Second Post Title")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/Search posts by title/i);
    await user.type(searchInput, "First");

    expect(screen.getByText("First Post Title")).toBeInTheDocument();
    expect(screen.queryByText("Second Post Title")).not.toBeInTheDocument();
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
});
