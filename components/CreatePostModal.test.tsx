import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreatePostModal } from "./CreatePostModal";
import HomePage from "@/app/page";
import { backend, BackendError, type NormalizedPaginatedPosts } from "@/lib/backend";
import { subscribeFeed, clearFeedSubscribers } from "@/lib/feed";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

describe("components/CreatePostModal", () => {
  beforeEach(() => {
    clearFeedSubscribers();
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(<CreatePostModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders modal form when isOpen is true", () => {
    render(<CreatePostModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Give your article a clear title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Write your article content here/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Publish Post/i })).toBeInTheDocument();
  });

  it("submits post successfully and calls onClose and onSuccess", async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    const mockPost = {
      id: 1,
      user_id: 1,
      title: "New Test Article",
      content: "This is test content",
      date_posted: "2026-04-12T00:00:00Z",
      author: {
        id: 1,
        username: "test",
        email: "test@example.com",
        avatarUrl: "/default.jpg",
        image_path: "/default.jpg",
      },
    };

    vi.spyOn(backend.posts, "createPost").mockResolvedValueOnce(mockPost);

    render(
      <CreatePostModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText(/Give your article a clear title/i),
      "New Test Article"
    );
    await user.type(
      screen.getByPlaceholderText(/Write your article content here/i),
      "This is test content"
    );

    await user.click(screen.getByRole("button", { name: /Publish Post/i }));

    await waitFor(() => {
      expect(backend.posts.createPost).toHaveBeenCalledWith({
        title: "New Test Article",
        content: "This is test content",
      });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    expect(toast.success).toHaveBeenCalledWith("Post created successfully!");
    expect(handleSuccess).toHaveBeenCalledTimes(1);
  });

  it("shows error feedback when post creation fails", async () => {
    vi.spyOn(backend.posts, "createPost").mockRejectedValueOnce(
      new Error("Post limit reached")
    );

    render(<CreatePostModal isOpen={true} onClose={vi.fn()} />);

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText(/Give your article a clear title/i),
      "Failing Article"
    );
    await user.type(
      screen.getByPlaceholderText(/Write your article content here/i),
      "Some content"
    );

    await user.click(screen.getByRole("button", { name: /Publish Post/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Post limit reached");
    });
  });

  it("displays normalized error message when backend returns BackendError", async () => {
    vi.spyOn(backend.posts, "createPost").mockRejectedValueOnce(
      new BackendError(422, "Content is required and cannot be empty")
    );

    render(<CreatePostModal isOpen={true} onClose={vi.fn()} />);

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText(/Give your article a clear title/i),
      "Validation Failure Post"
    );
    await user.type(
      screen.getByPlaceholderText(/Write your article content here/i),
      "Valid text"
    );

    await user.click(screen.getByRole("button", { name: /Publish Post/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Content is required and cannot be empty");
    });
  });

  it("calls onClose when Cancel button is clicked", async () => {
    const handleClose = vi.fn();
    render(<CreatePostModal isOpen={true} onClose={handleClose} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("triggers feed invalidation and navigates home when post creation succeeds without onSuccess", async () => {
    const router = useRouter();
    const handleClose = vi.fn();
    const feedListener = vi.fn();
    const unsubscribe = subscribeFeed({ callback: feedListener });
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    const mockPost = {
      id: 99,
      user_id: 1,
      title: "Navigation Test Article",
      content: "Navigation test content",
      date_posted: "2026-04-12T00:00:00Z",
      author: {
        id: 1,
        username: "test",
        email: "test@example.com",
        avatarUrl: "/default.jpg",
        image_path: "/default.jpg",
      },
    };

    vi.spyOn(backend.posts, "createPost").mockResolvedValueOnce(mockPost);

    render(<CreatePostModal isOpen={true} onClose={handleClose} />);

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText(/Give your article a clear title/i),
      "Navigation Test Article"
    );
    await user.type(
      screen.getByPlaceholderText(/Write your article content here/i),
      "Navigation test content"
    );

    await user.click(screen.getByRole("button", { name: /Publish Post/i }));

    await waitFor(() => {
      expect(backend.posts.createPost).toHaveBeenCalledWith({
        title: "Navigation Test Article",
        content: "Navigation test content",
      });
      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(feedListener).toHaveBeenCalledTimes(1);
      expect(router.push).toHaveBeenCalledWith("/");
      expect(router.refresh).toHaveBeenCalledTimes(1);
    });

    expect(dispatchSpy).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("triggers feed invalidation when onSuccess callback is supplied", async () => {
    const handleSuccess = vi.fn();
    const feedListener = vi.fn();
    const unsubscribe = subscribeFeed({ callback: feedListener });

    const mockPost = {
      id: 100,
      user_id: 1,
      title: "Callback Test Article",
      content: "Callback test content",
      date_posted: "2026-04-12T00:00:00Z",
      author: {
        id: 1,
        username: "test",
        email: "test@example.com",
        avatarUrl: "/default.jpg",
        image_path: "/default.jpg",
      },
    };

    vi.spyOn(backend.posts, "createPost").mockResolvedValueOnce(mockPost);

    render(
      <CreatePostModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={handleSuccess}
      />
    );

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText(/Give your article a clear title/i),
      "Callback Test Article"
    );
    await user.type(
      screen.getByPlaceholderText(/Write your article content here/i),
      "Callback test content"
    );

    await user.click(screen.getByRole("button", { name: /Publish Post/i }));

    await waitFor(() => {
      expect(feedListener).toHaveBeenCalledTimes(1);
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });

    unsubscribe();
  });

  it("automatically refreshes active HomePage feed when post creation succeeds", async () => {
    const initialPosts: NormalizedPaginatedPosts = {
      posts: [
        {
          id: 1,
          user_id: 1,
          title: "Initial Feed Article",
          content: "Initial content",
          date_posted: "2026-04-10T00:00:00Z",
          author: {
            id: 1,
            username: "author1",
            email: "author1@example.com",
            avatarUrl: "/default.jpg",
            image_path: "/default.jpg",
          },
        },
      ],
      total: 1,
      skip: 0,
      limit: 10,
      has_more: false,
    };

    const refreshedPosts: NormalizedPaginatedPosts = {
      posts: [
        {
          id: 2,
          user_id: 1,
          title: "Brand New Article",
          content: "Freshly created content",
          date_posted: "2026-04-12T00:00:00Z",
          author: {
            id: 1,
            username: "author1",
            email: "author1@example.com",
            avatarUrl: "/default.jpg",
            image_path: "/default.jpg",
          },
        },
        ...initialPosts.posts,
      ],
      total: 2,
      skip: 0,
      limit: 10,
      has_more: false,
    };

    vi.spyOn(backend.posts, "getPosts")
      .mockResolvedValueOnce(initialPosts)
      .mockResolvedValueOnce(refreshedPosts);

    vi.spyOn(backend.posts, "createPost").mockResolvedValueOnce({
      id: 2,
      user_id: 1,
      title: "Brand New Article",
      content: "Freshly created content",
      date_posted: "2026-04-12T00:00:00Z",
      author: initialPosts.posts[0].author,
    });

    render(
      <div>
        <HomePage />
        <CreatePostModal isOpen={true} onClose={vi.fn()} />
      </div>
    );

    await waitFor(() => {
      expect(screen.getByText("Initial Feed Article")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText(/Give your article a clear title/i),
      "Brand New Article"
    );
    await user.type(
      screen.getByPlaceholderText(/Write your article content here/i),
      "Freshly created content"
    );

    await user.click(screen.getByRole("button", { name: /Publish Post/i }));

    await waitFor(() => {
      expect(screen.getByText("Brand New Article")).toBeInTheDocument();
      expect(screen.getByText("Initial Feed Article")).toBeInTheDocument();
    });
  });
});
