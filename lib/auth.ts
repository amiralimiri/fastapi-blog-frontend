import { apiFetch, clearToken, getToken } from "./api";
import type { User } from "./types";

let cachedUser: User | null | undefined;
let pending: Promise<User | null> | null = null;

export async function getCurrentUser(force = false): Promise<User | null> {
  if (!force && cachedUser !== undefined) return cachedUser;
  if (!getToken()) {
    cachedUser = null;
    return null;
  }
  if (pending) return pending;
  pending = (async () => {
    try {
      const response = await apiFetch("/api/users/me");
      if (!response.ok) {
        clearToken();
        cachedUser = null;
        return null;
      }
      cachedUser = await response.json();
      return cachedUser!;
    } catch {
      return null;
    } finally {
      pending = null;
    }
  })();
  return pending;
}

export function invalidateUser() {
  cachedUser = undefined;
}
export function logout() {
  clearToken();
  cachedUser = null;
}
