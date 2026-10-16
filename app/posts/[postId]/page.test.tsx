import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PostPage from "./page";
import { AuthProvider } from "@/context/AuthContext";
import { setToken } from "@/lib/api";
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
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(mockPostDetail), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

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

    // Mock 1: /api/posts/1 for the post details
    // Mock 2: /api/users/me for the AuthProvider
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockPostDetail), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 10, // matching user_id
            username: "super_author",
            email: "super@example.com",
            image_path: "/static/default.jpg",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

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

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockPostDetail), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 999, // different user_id
            username: "some_reader",
            email: "reader@example.com",
            image_path: "/static/default.jpg",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

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
});
