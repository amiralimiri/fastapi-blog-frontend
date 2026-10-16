import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Register from "./page";
import { toast } from "sonner";

describe("app/register/page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders register form with all required fields", () => {
    render(<Register />);

    expect(screen.getByRole("heading", { name: /Register/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("johndoe")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Repeat your password")).toBeInTheDocument();
  });

  it("warns about password mismatch and disables register button", async () => {
    render(<Register />);

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("At least 8 characters"), "password123");
    await user.type(screen.getByPlaceholderText("Repeat your password"), "different123");

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /Register/i });
    expect(btn).toBeDisabled();
  });

  it("successfully registers user and navigates to login", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 1,
          username: "newuser",
          email: "new@example.com",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    );

    render(<Register />);

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("johndoe"), "newuser");
    await user.type(screen.getByPlaceholderText("you@example.com"), "new@example.com");
    await user.type(screen.getByPlaceholderText("At least 8 characters"), "password123");
    await user.type(screen.getByPlaceholderText("Repeat your password"), "password123");

    const btn = screen.getByRole("button", { name: /Register/i });
    expect(btn).not.toBeDisabled();
    await user.click(btn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Account created successfully! You can now log in."
      );
    });
  });
});
