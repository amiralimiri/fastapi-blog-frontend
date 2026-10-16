import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PostCard } from "./PostCard";
import type { Post } from "@/lib/types";

const mockPost: Post = {
  id: 101,
  user_id: 5,
  title: "Building Fast Web Apps with Next.js 16",
  content: "This is a detailed article exploring modern Next.js architecture.",
  date_posted: "2026-04-10T14:30:00Z",
  author: {
    id: 5,
    username: "alice_dev",
    email: "alice@example.com",
    image_file: null,
    image_path: "/static/profiles/alice.png",
  },
};

describe("components/PostCard", () => {
  it("renders post title, author, date, and content snippet", () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText("Building Fast Web Apps with Next.js 16")).toBeInTheDocument();
    expect(screen.getByText("alice_dev")).toBeInTheDocument();
    expect(screen.getByText(/April|2026/)).toBeInTheDocument();
    expect(
      screen.getByText("This is a detailed article exploring modern Next.js architecture.")
    ).toBeInTheDocument();
  });

  it("links to post detail page and user posts page", () => {
    render(<PostCard post={mockPost} />);

    const titleLink = screen.getByText("Building Fast Web Apps with Next.js 16").closest("a");
    expect(titleLink).toHaveAttribute("href", "/posts/101");

    const authorLink = screen.getByText("alice_dev").closest("a");
    expect(authorLink).toHaveAttribute("href", "/users/5/posts");
  });

  it("falls back to user icon placeholder when author avatar fails to load", () => {
    render(<PostCard post={mockPost} />);

    const img = screen.getByAltText("alice_dev's profile");
    expect(img).toBeInTheDocument();

    // Trigger image error
    fireEvent.error(img);

    // The image should be replaced by fallback icon container
    expect(screen.queryByAltText("alice_dev's profile")).not.toBeInTheDocument();
  });
});
