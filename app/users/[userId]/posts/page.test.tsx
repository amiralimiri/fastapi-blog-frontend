import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPosts from "./page";
import { backend } from "@/lib/backend";
import type { NormalizedPaginatedPosts, NormalizedUser } from "@/lib/backend";

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

    vi.spyOn(backend.posts, "getUserPosts")
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    render(<UserPosts />);

    await waitFor(() => {
      expect(screen.getByText("Author First Post")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const loadMoreBtn = screen.getByRole("button", { name: /Load More Posts/i });
    await user.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getByText("Author Second Post")).toBeInTheDocument();
    });

    expect(backend.posts.getUserPosts).toHaveBeenLastCalledWith("1", { skip: 1, limit: 10 });
  });
});
