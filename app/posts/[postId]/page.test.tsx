import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PostPage from "./page";
import { AuthProvider } from "@/context/AuthContext";
import { setToken } from "@/lib/api";
import { postsService, usersService } from "@/lib/services";
import { backend } from "@/lib/backend";
import type { Post } from "@/lib/types";

const mockPostDetail: Post = {
  id: 1,
  user_id: 10,
  title: "Mastering TypeScript & Next.js",
  content: "Deep dive into clean architecture in React.",
  date_posted: "2026-03-20T08:00:00Z",
  author: {
    id: 10,
    username: "super_author",
    email: "super@example.com",
    image_file: null,
    image_path: "/static/default.jpg",
  },
};

describe("app/posts/[postId]/page (PostPage)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders post details for guests without Edit or Delete buttons", async () => {
    vi.spyOn(postsService, "getPostById").mockResolvedValue(mockPostDetail);

    render(
      <AuthProvider>
        <PostPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Mastering TypeScript & Next.js" })
      ).toBeInTheDocument();
    });

    expect(screen.getByText("super_author")).toBeInTheDocument();
    expect(
      screen.getByText("Deep dive into clean architecture in React.")
    ).toBeInTheDocument();

    // Guest should not see Edit or Delete buttons
    expect(screen.queryByText("Edit Post")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete Post")).not.toBeInTheDocument();
  });

  it("displays Edit and Delete buttons when logged in user is the post author", async () => {
    setToken("author-token");

    vi.spyOn(postsService, "getPostById").mockResolvedValue(mockPostDetail);
    vi.spyOn(usersService, "getCurrentUser").mockResolvedValue({
      id: 10, // matching user_id
      username: "super_author",
      email: "super@example.com",
      image_file: null,
      image_path: "/static/default.jpg",
    });
    vi.spyOn(backend.users, "getCurrentUser").mockResolvedValue({
      id: 10,
      username: "super_author",
      email: "super@example.com",
      avatarUrl: "/static/default.jpg",
      image_path: "/static/default.jpg",
    });

    render(
      <AuthProvider>
        <PostPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Edit Post")).toBeInTheDocument();
      expect(screen.getByText("Delete Post")).toBeInTheDocument();
    });
  });

  it("hides Edit and Delete buttons when logged in user is NOT the author", async () => {
    setToken("other-user-token");

    vi.spyOn(postsService, "getPostById").mockResolvedValue(mockPostDetail);
    vi.spyOn(usersService, "getCurrentUser").mockResolvedValue({
      id: 999, // different user_id
      username: "some_reader",
      email: "reader@example.com",
      image_file: null,
      image_path: "/static/default.jpg",
    });
    vi.spyOn(backend.users, "getCurrentUser").mockResolvedValue({
      id: 999,
      username: "some_reader",
      email: "reader@example.com",
      avatarUrl: "/static/default.jpg",
      image_path: "/static/default.jpg",
    });

    render(
      <AuthProvider>
        <PostPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Mastering TypeScript & Next.js" })
      ).toBeInTheDocument();
    });

    expect(screen.queryByText("Edit Post")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete Post")).not.toBeInTheDocument();
  });

  it("renders retry button on fetch failure and retries loading post", async () => {
    const postSpy = vi.spyOn(postsService, "getPostById")
      .mockRejectedValue(new Error("Network failed"));

    render(
      <AuthProvider>
        <PostPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Unable to load post/i)).toBeInTheDocument();
    });

    postSpy.mockResolvedValue(mockPostDetail);

    const user = userEvent.setup();
    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Mastering TypeScript & Next.js" })
      ).toBeInTheDocument();
    });
  });
});
