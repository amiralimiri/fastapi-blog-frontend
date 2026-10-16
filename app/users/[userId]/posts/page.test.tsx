import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPosts from "./page";
import { usersService, postsService } from "@/lib/services";
import type { PaginatedPosts, User } from "@/lib/types";

const mockAuthor: User = {
  id: 1,
  username: "johndoe",
  email: "john@example.com",
  image_file: null,
  image_path: "/default.jpg",
};

const mockUserPosts: PaginatedPosts = {
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
    vi.spyOn(usersService, "getUserById").mockResolvedValue(mockAuthor);
    vi.spyOn(postsService, "getUserPosts").mockResolvedValue(mockUserPosts);

    render(<UserPosts />);

    await waitFor(() => {
      expect(screen.getByText("Posts by johndoe")).toBeInTheDocument();
    });

    expect(screen.getByText("Author First Post")).toBeInTheDocument();
    expect(screen.getByText("Total published posts: 1")).toBeInTheDocument();
  });

  it("renders empty state when user has no posts", async () => {
    vi.spyOn(usersService, "getUserById").mockResolvedValue(mockAuthor);
    vi.spyOn(postsService, "getUserPosts").mockResolvedValue({
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
    const userSpy = vi.spyOn(usersService, "getUserById")
      .mockRejectedValue(new Error("Network failure"));

    vi.spyOn(postsService, "getUserPosts").mockResolvedValue(mockUserPosts);

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
});
