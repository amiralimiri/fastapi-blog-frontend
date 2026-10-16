import { apiFetch, apiPath, getErrorMessage } from "@/lib/api";
import type { User } from "@/lib/types";

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  current_password?: string;
  new_password: string;
}

export const usersService = {
  async getCurrentUser(): Promise<User> {
    const res = await apiFetch("/api/users/me");
    if (!res.ok) {
      throw new Error(getErrorMessage(await res.json().catch(() => null)));
    }
    return res.json();
  },

  async getUserById(userId: string | number): Promise<User> {
    const res = await fetch(apiPath(`/api/users/${userId}`));
    if (!res.ok) {
      throw new Error(getErrorMessage(await res.json().catch(() => null)));
    }
    return res.json();
  },

  async updateProfile(userId: string | number, payload: UpdateProfilePayload): Promise<User> {
    const res = await apiFetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const error = new Error(getErrorMessage(errorData)) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    return res.json();
  },

  async uploadProfilePicture(userId: string | number, file: File): Promise<User> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiFetch(`/api/users/${userId}/picture`, {
      method: "PATCH",
      body: formData,
    });
    if (!res.ok) {
      throw new Error(getErrorMessage(await res.json().catch(() => null)));
    }
    return res.json();
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    const res = await apiFetch("/api/users/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: payload.current_password,
        new_password: payload.new_password,
      }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const error = new Error(getErrorMessage(errorData)) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
  },

  async deleteAccount(userId: string | number): Promise<void> {
    const res = await apiFetch(`/api/users/${userId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(getErrorMessage(await res.json().catch(() => null)));
    }
  },
};
