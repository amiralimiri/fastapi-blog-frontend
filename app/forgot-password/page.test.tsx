import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordPage from "./page";
import { authService } from "@/lib/services";
import { toast } from "sonner";

describe("app/forgot-password/page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders forgot password form", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("heading", { name: /Forgot Password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send Reset Link/i })).toBeInTheDocument();
  });

  it("sends reset link successfully and shows success notice", async () => {
    const forgotSpy = vi.spyOn(authService, "forgotPassword").mockResolvedValue();

    render(<ForgotPasswordPage />);

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(forgotSpy).toHaveBeenCalledWith("user@example.com");
    });

    expect(toast.success).toHaveBeenCalledWith("Reset link sent!");
    expect(
      screen.getByText(/If an account exists with this email/i)
    ).toBeInTheDocument();
  });

  it("displays error message when request fails", async () => {
    vi.spyOn(authService, "forgotPassword").mockRejectedValue(
      new Error("User not found")
    );

    render(<ForgotPasswordPage />);

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("you@example.com"), "unknown@example.com");
    await user.click(screen.getByRole("button", { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(screen.getByText("User not found")).toBeInTheDocument();
    });
    expect(toast.error).toHaveBeenCalledWith("User not found");
  });
});
