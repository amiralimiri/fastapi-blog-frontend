import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPasswordPage from "./page";
import { backend, BackendError } from "@/lib/backend";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

describe("app/reset-password/page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("warns when token is missing from query string", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>
    );

    render(<ResetPasswordPage />);

    expect(
      screen.getByText(/Invalid or missing reset token/i)
    ).toBeInTheDocument();
  });

  it("submits new password when token is present and passwords match", async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("token=valid-reset-token-123") as unknown as ReturnType<typeof useSearchParams>
    );

    const resetSpy = vi.spyOn(backend.auth, "resetPassword").mockResolvedValue();

    render(<ResetPasswordPage />);

    const user = userEvent.setup();
    const p1Input = screen.getByPlaceholderText("At least 8 characters");
    const p2Input = screen.getByPlaceholderText("Repeat new password");

    await user.type(p1Input, "newPassword123!");
    await user.type(p2Input, "newPassword123!");

    const submitBtn = screen.getByRole("button", { name: /Reset Password/i });
    expect(submitBtn).not.toBeDisabled();
    await user.click(submitBtn);

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith({
        token: "valid-reset-token-123",
        new_password: "newPassword123!",
      });
    });

    expect(toast.success).toHaveBeenCalledWith(
      "Password reset successfully! You can now log in with your new password."
    );
  });

  it("displays error message when password reset fails", async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("token=expired-token") as unknown as ReturnType<typeof useSearchParams>
    );

    vi.spyOn(backend.auth, "resetPassword").mockRejectedValue(
      new BackendError(400, "Reset token has expired")
    );

    render(<ResetPasswordPage />);

    const user = userEvent.setup();
    const p1Input = screen.getByPlaceholderText("At least 8 characters");
    const p2Input = screen.getByPlaceholderText("Repeat new password");

    await user.type(p1Input, "newPassword123!");
    await user.type(p2Input, "newPassword123!");

    const submitBtn = screen.getByRole("button", { name: /Reset Password/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Reset token has expired Please request a new password reset\./i)
      ).toBeInTheDocument();
    });
    expect(toast.error).toHaveBeenCalledWith(
      "Reset token has expired Please request a new password reset."
    );
  });
});
