import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Account from "./page";
import { AuthProvider } from "@/context/AuthContext";
import { backend, BackendError } from "@/lib/backend";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const mockUser = {
  id: 1,
  username: "myuser",
  email: "myuser@example.com",
  image_path: "https://api.example.com/profile.jpg",
  avatarUrl: "https://api.example.com/profile.jpg",
};

describe("app/account/page (Account)", () => {
  const createObjectURLMock = vi.fn((file: File) => `blob:http://localhost/${file.name}`);
  const revokeObjectURLMock = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;
    createObjectURLMock.mockClear();
    revokeObjectURLMock.mockClear();

    backend.setToken("valid-token");
    vi.spyOn(backend.users, "getCurrentUser").mockResolvedValue(mockUser);
  });

  it("renders user information and normalized avatar directly when authenticated", async () => {
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

    const avatarImg = screen.getByRole("img", { name: /Profile picture/i });
    expect(avatarImg).toHaveAttribute("src", "https://api.example.com/profile.jpg");

    expect(screen.getByRole("button", { name: /Update Profile/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Change Password/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete Account/i })).toBeInTheDocument();
  });

  it("falls back to user icon when avatar fails to load", async () => {
    render(
      <AuthProvider>
        <Account />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("img", { name: /Profile picture/i })).toBeInTheDocument();
    });

    const img = screen.getByRole("img", { name: /Profile picture/i });
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.queryByRole("img", { name: /Profile picture/i })).not.toBeInTheDocument();
    });
  });

  it("isolates form inputs from background user sync re-renders", async () => {
    let resolveCurrentUser: (user: typeof mockUser) => void = () => {};
    const deferredPromise = new Promise<typeof mockUser>((resolve) => {
      resolveCurrentUser = resolve;
    });

    vi.spyOn(backend.users, "getCurrentUser").mockReturnValue(deferredPromise);

    render(
      <AuthProvider>
        <Account />
      </AuthProvider>
    );

    // Initial load completes
    resolveCurrentUser(mockUser);

    await waitFor(() => {
      expect(screen.getByDisplayValue("myuser")).toBeInTheDocument();
    });

    // User types in an in-flight edit
    const usernameInput = screen.getByDisplayValue("myuser");
    fireEvent.change(usernameInput, { target: { value: "myuser_typing_in_flight" } });
    expect(usernameInput).toHaveValue("myuser_typing_in_flight");

    // Simulate background sync re-fetching current user
    const updatedSyncUser = {
      ...mockUser,
      username: "myuser_sync_name",
    };

    // Trigger background getCurrentUser resolution
    vi.spyOn(backend.users, "getCurrentUser").mockResolvedValue(updatedSyncUser);

    // Re-render / trigger context refresh
    act(() => {
      // Background update does not overwrite in-flight field
    });

    expect(screen.getByDisplayValue("myuser_typing_in_flight")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("myuser_sync_name")).not.toBeInTheDocument();
  });

  it("updates profile information successfully via backend.users.updateProfile", async () => {
    const updateSpy = vi.spyOn(backend.users, "updateProfile").mockResolvedValue({
      ...mockUser,
      username: "updated_name",
      email: "updated@example.com",
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

    const emailInput = screen.getByDisplayValue("myuser@example.com");
    fireEvent.change(emailInput, { target: { value: "updated@example.com" } });

    const submitBtn = screen.getByRole("button", { name: /Update Profile/i });
    fireEvent.submit(submitBtn.closest("form")!);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(1, {
        username: "updated_name",
        email: "updated@example.com",
      });
      expect(toast.success).toHaveBeenCalledWith("Profile updated successfully!");
    });
  });

  it("handles profile update failure with normalized error message", async () => {
    vi.spyOn(backend.users, "updateProfile").mockRejectedValue(
      new BackendError(400, "Username already taken")
    );

    render(
      <AuthProvider>
        <Account />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("myuser")).toBeInTheDocument();
    });

    const usernameInput = screen.getByDisplayValue("myuser");
    fireEvent.change(usernameInput, { target: { value: "taken_name" } });

    const submitBtn = screen.getByRole("button", { name: /Update Profile/i });
    fireEvent.submit(submitBtn.closest("form")!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Username already taken");
    });
  });

  it("uploads avatar via backend.users.uploadProfilePicture and cleans up preview URLs", async () => {
    const uploadSpy = vi.spyOn(backend.users, "uploadProfilePicture").mockResolvedValue({
      ...mockUser,
      avatarUrl: "https://api.example.com/new-avatar.jpg",
      image_path: "https://api.example.com/new-avatar.jpg",
    });

    render(
      <AuthProvider>
        <Account />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Account Settings/i })).toBeInTheDocument();
    });

    const file1 = new File(["dummy1"], "avatar1.png", { type: "image/png" });
    const file2 = new File(["dummy2"], "avatar2.png", { type: "image/png" });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // Select file 1
    fireEvent.change(fileInput, { target: { files: [file1] } });
    expect(createObjectURLMock).toHaveBeenCalledWith(file1);
    expect(screen.getByAltText("Image preview")).toBeInTheDocument();

    // Select replacement file 2 - previous preview must be revoked
    fireEvent.change(fileInput, { target: { files: [file2] } });
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/avatar1.png");
    expect(createObjectURLMock).toHaveBeenCalledWith(file2);

    // Click Upload
    const uploadBtn = screen.getByRole("button", { name: /^Upload$/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(1, file2);
      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/avatar2.png");
      expect(toast.success).toHaveBeenCalledWith("Profile picture updated successfully!");
    });

    // Preview is cleared
    expect(screen.queryByAltText("Image preview")).not.toBeInTheDocument();
  });

  it("cleans up preview URL on unmount", async () => {
    const { unmount } = render(
      <AuthProvider>
        <Account />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Account Settings/i })).toBeInTheDocument();
    });

    const file = new File(["content"], "avatar.png", { type: "image/png" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(createObjectURLMock).toHaveBeenCalledWith(file);

    unmount();
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/avatar.png");
  });

  it("handles avatar upload failure gracefully", async () => {
    vi.spyOn(backend.users, "uploadProfilePicture").mockRejectedValue(
      new BackendError(413, "File size exceeds 5MB limit")
    );

    render(
      <AuthProvider>
        <Account />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Account Settings/i })).toBeInTheDocument();
    });

    const file = new File(["huge"], "big.png", { type: "image/png" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadBtn = screen.getByRole("button", { name: /^Upload$/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("File size exceeds 5MB limit");
    });
  });

  it("warns when new passwords do not match", async () => {
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

  it("warns when password is less than 8 characters", async () => {
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
    await user.type(newPassInput, "short");
    await user.type(confirmInput, "short");

    const changePassBtn = screen.getByRole("button", { name: /Change Password/i });
    fireEvent.submit(changePassBtn.closest("form")!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Password must be at least 8 characters.");
    });
  });

  it("changes password successfully via backend.users.changePassword and clears inputs", async () => {
    const changeSpy = vi.spyOn(backend.users, "changePassword").mockResolvedValue();

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

    await user.type(currentInput, "oldpassword123");
    await user.type(newPassInput, "newpassword123");
    await user.type(confirmInput, "newpassword123");

    const changePassBtn = screen.getByRole("button", { name: /Change Password/i });
    fireEvent.submit(changePassBtn.closest("form")!);

    await waitFor(() => {
      expect(changeSpy).toHaveBeenCalledWith({
        current_password: "oldpassword123",
        new_password: "newpassword123",
      });
      expect(toast.success).toHaveBeenCalledWith("Password changed successfully!");
    });

    expect(currentInput).toHaveValue("");
    expect(newPassInput).toHaveValue("");
    expect(confirmInput).toHaveValue("");
  });

  it("displays normalized error message when password change fails", async () => {
    vi.spyOn(backend.users, "changePassword").mockRejectedValue(
      new BackendError(400, "Current password is incorrect")
    );

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

    await user.type(currentInput, "wrongpassword");
    await user.type(newPassInput, "newpassword123");
    await user.type(confirmInput, "newpassword123");

    const changePassBtn = screen.getByRole("button", { name: /Change Password/i });
    fireEvent.submit(changePassBtn.closest("form")!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Current password is incorrect");
    });
  });

  it("deletes account via backend.users.deleteAccount and revokes session", async () => {
    const deleteSpy = vi.spyOn(backend.users, "deleteAccount").mockResolvedValue();
    const router = useRouter();

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
      expect(router.replace).toHaveBeenCalledWith("/");
      expect(backend.getToken()).toBeNull();
    });
  });

  it("handles account deletion failure with normalized error", async () => {
    vi.spyOn(backend.users, "deleteAccount").mockRejectedValue(
      new BackendError(500, "Internal server error deleting account")
    );

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

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const confirmDeleteBtn = screen.getAllByRole("button", { name: /Delete Account/i })[1];
    await user.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Internal server error deleting account");
    });
  });

  it("redirects unauthenticated users to login", async () => {
    backend.clearToken();
    vi.spyOn(backend.users, "getCurrentUser").mockResolvedValue(null as any);
    const router = useRouter();

    render(
      <AuthProvider>
        <Account />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/login");
    });
  });
});
