import { apiPath, getErrorMessage } from "@/lib/api";
import type { User } from "@/lib/types";

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export const authService = {
  async login(emailOrUsername: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const formData = new FormData();
    formData.append("username", emailOrUsername);
    formData.append("password", password);

    const res = await fetch(apiPath("/api/users/token"), {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(getErrorMessage(await res.json().catch(() => null)));
    }
    return res.json();
  },

  async register(payload: RegisterPayload): Promise<User> {
    const res = await fetch(apiPath("/api/users"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(getErrorMessage(await res.json().catch(() => null)));
    }
    return res.json();
  },

  async forgotPassword(email: string): Promise<void> {
    const res = await fetch(apiPath("/api/users/forgot-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      throw new Error(getErrorMessage(await res.json().catch(() => null)));
    }
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    const res = await fetch(apiPath("/api/users/reset-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(getErrorMessage(await res.json().catch(() => null)));
    }
  },
};
