import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PostPage from "./page";
import { AuthProvider } from "@/context/AuthContext";
import { backend, BackendError } from "@/lib/backend";
import type { NormalizedPost } from "@/lib/backend";
import { subscribeFeed, clearFeedSubscribers } from "@/lib/feed";
import { useRouter } from "next/navigation";

const mockPostDetail: NormalizedPost = {
  id: 1,
  user_id: 10,
  title: "Mastering TypeScript & Next.js",
  content: "Deep dive into clean architecture in React.",
  date_posted: "2026-03-20T08:00:00Z",
  author: {
    id: 10,
    username: "super_author",
    email: "super@example.com",
    avatarUrl: "/static/default.jpg",
    image_path: "/static/default.jpg",
  },
};

describe("app/posts/[postId]/page (PostPage)", () => {
  beforeEach(() => {
    clearFeedSubscribers();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders post details for guests without Edit or Delete buttons", async () => {
    vi.spyOn(backend.posts, "getPostById").mockResolvedValue(mockPostDetail);

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
    backend.setToken("author-token");

    vi.spyOn(backend.posts, "getPostById").mockResolvedValue(mockPostDetail);
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
    backend.setToken("other-user-token");

    vi.spyOn(backend.posts, "getPostById").mockResolvedValue(mockPostDetail);
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
    const postSpy = vi.spyOn(backend.posts, "getPostById")
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

  it("redirects to /not-found when getPostById throws 404 BackendError", async () => {
    const router = useRouter();
    vi.spyOn(backend.posts, "getPostById").mockRejectedValue(
      new BackendError(404, "Post not found")
    );

    render(
      <AuthProvider>
        <PostPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/not-found");
    });
  });

  it("updates post via backend.posts.updatePost when author saves changes", async () => {
    backend.setToken("author-token");
    vi.spyOn(backend.posts, "getPostById").mockResolvedValue(mockPostDetail);
    vi.spyOn(backend.users, "getCurrentUser").mockResolvedValue({
      id: 10,
      username: "super_author",
      email: "super@example.com",
      avatarUrl: "/static/default.jpg",
      image_path: "/static/default.jpg",
    });
    vi.spyOn(backend.posts, "updatePost").mockResolvedValue({
      ...mockPostDetail,
      title: "Mastering Clean Architecture",
    });

    render(
      <AuthProvider>
        <PostPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Edit Post")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Edit Post"));

    const titleInput = screen.getByDisplayValue("Mastering TypeScript & Next.js");
    await user.clear(titleInput);
    await user.type(titleInput, "Mastering Clean Architecture");

    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(backend.posts.updatePost).toHaveBeenCalledWith("1", {
        title: "Mastering Clean Architecture",
        content: "Deep dive into clean architecture in React.",
      });
      expect(screen.getByRole("heading", { name: "Mastering Clean Architecture" })).toBeInTheDocument();
    });
  });

  it("deletes post via backend.posts.deletePost when author confirms deletion", async () => {
    const router = useRouter();
    backend.setToken("author-token");
    vi.spyOn(backend.posts, "getPostById").mockResolvedValue(mockPostDetail);
    vi.spyOn(backend.users, "getCurrentUser").mockResolvedValue({
      id: 10,
      username: "super_author",
      email: "super@example.com",
      avatarUrl: "/static/default.jpg",
      image_path: "/static/default.jpg",
    });
    vi.spyOn(backend.posts, "deletePost").mockResolvedValue();

    const globalFeedListener = vi.fn();
    const authorFeedListener = vi.fn();
    const otherFeedListener = vi.fn();
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    const unsubGlobal = subscribeFeed({ callback: globalFeedListener });
    const unsubAuthor = subscribeFeed({ userId: 10, callback: authorFeedListener });
    const unsubOther = subscribeFeed({ userId: 999, callback: otherFeedListener });

    render(
      <AuthProvider>
        <PostPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Delete Post")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Delete Post"));

    const confirmDeleteBtn = screen.getByRole("button", { name: /^Delete$/i });
    await user.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(backend.posts.deletePost).toHaveBeenCalledWith("1");
      expect(router.push).toHaveBeenCalledWith("/");
      expect(globalFeedListener).toHaveBeenCalledTimes(1);
      expect(authorFeedListener).toHaveBeenCalledTimes(1);
      expect(otherFeedListener).not.toHaveBeenCalled();
    });

    expect(dispatchSpy).not.toHaveBeenCalled();

    unsubGlobal();
    unsubAuthor();
    unsubOther();
  });
});
