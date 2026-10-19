import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreatePostModal } from "./CreatePostModal";
import { backend, BackendError } from "@/lib/backend";
import { toast } from "sonner";

describe("components/CreatePostModal", () => {
  beforeEach(() => {
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
});
