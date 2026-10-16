export function apiPath(path: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${basePath}${path}`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setToken(token: string): void {
  localStorage.setItem("access_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("access_token");
}

export function getErrorMessage(error: unknown): string {
  if (!error) return "An error occurred. Please try again.";
  if (typeof error === "string") return error;

  const err = error as Record<string, unknown>;
  if (typeof err.detail === "string") return err.detail;
  if (Array.isArray(err.detail)) {
    return err.detail
      .map((e: unknown) => {
        if (typeof e === "string") return e;
        if (e && typeof e === "object" && "msg" in e && typeof e.msg === "string") {
          return e.msg;
        }
        return JSON.stringify(e);
      })
      .join(". ");
  }
  if (typeof err.message === "string") return err.message;
  return "An error occurred. Please try again.";
}

export function formatDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  } catch {
    return date;
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(apiPath(path), { ...init, headers });
}

