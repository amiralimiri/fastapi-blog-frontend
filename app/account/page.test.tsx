import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Account from "./page";
import { AuthProvider } from "@/context/AuthContext";
import { usersService } from "@/lib/services";
import { setToken } from "@/lib/api";
import { toast } from "sonner";

const mockUser = {
  id: 1,
  username: "myuser",
  email: "myuser@example.com",
  image_file: null,
  image_path: "/profile.jpg",
};

describe("app/account/page (Account)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders user information when authenticated", async () => {
    setToken("valid-token");
    vi.spyOn(usersService, "getCurrentUser").mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <Account />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Account Settings/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue("myuser")).toBeInTheDocument();
      expect(screen.getByDisplayValue("myuser@example.com")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Update Profile/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Change Password/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete Account/i })).toBeInTheDocument();
  });

  it("updates profile information successfully", async () => {
    setToken("valid-token");
    vi.spyOn(usersService, "getCurrentUser").mockResolvedValue(mockUser);
    const updateSpy = vi.spyOn(usersService, "updateProfile").mockResolvedValue({
      ...mockUser,
      username: "updated_name",
    });

    render(
      <AuthProvider>
        <Account />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("myuser")).toBeInTheDocument();
    });

    const usernameInput = screen.getByDisplayValue("myuser");
    fireEvent.change(usernameInput, { target: { value: "updated_name" } });

    const submitBtn = screen.getByRole("button", { name: /Update Profile/i });
    fireEvent.submit(submitBtn.closest("form")!);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(1, {
        username: "updated_name",
        email: "myuser@example.com",
      });
      expect(toast.success).toHaveBeenCalledWith("Profile updated successfully!");
    });
  });

  it("warns when new passwords do not match", async () => {
    setToken("valid-token");
    vi.spyOn(usersService, "getCurrentUser").mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <Account />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Account Settings/i })).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const currentInput = screen.getByLabelText(/Current Password/i);
    const newPassInput = screen.getByLabelText(/^New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm New Password/i);

    await user.type(currentInput, "oldpassword");
    await user.type(newPassInput, "newpassword123");
    await user.type(confirmInput, "differentpass123");

    const changePassBtn = screen.getByRole("button", { name: /Change Password/i });
    fireEvent.submit(changePassBtn.closest("form")!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("New passwords do not match.");
    });
  });

  it("opens modal when clicking Delete Account and deletes account on confirm", async () => {
    setToken("valid-token");
    vi.spyOn(usersService, "getCurrentUser").mockResolvedValue(mockUser);
    const deleteSpy = vi.spyOn(usersService, "deleteAccount").mockResolvedValue();

    render(
      <AuthProvider>
        <Account />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Delete Account/i })).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Delete Account/i }));

    // Modal dialog is shown
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByText("Delete Account?")).toBeInTheDocument();

    // Confirm button inside modal
    const confirmDeleteBtn = screen.getAllByRole("button", { name: /Delete Account/i })[1];
    await user.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith("Account deleted successfully.");
    });
  });
});
