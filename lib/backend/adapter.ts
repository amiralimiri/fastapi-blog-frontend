import { normalizeBackendError } from "./errors";
import {
  normalizePaginatedPosts,
  normalizePost,
  normalizeUser,
} from "./normalization";
import type {
  AuthTokenResponse,
  BackendAdapter,
  BackendAdapterConfig,
  BackendTokenStorage,
  ChangePasswordPayload,
  CreatePostPayload,
  GetPostsParams,
  NormalizedPaginatedPosts,
  NormalizedPost,
  NormalizedUser,
  RegisterPayload,
  ResetPasswordPayload,
  UpdatePostPayload,
  UpdateProfilePayload,
} from "./types";

class BrowserTokenStorage implements BackendTokenStorage {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  }

  setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("access_token", token);
  }

  clearToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
  }
}

export function createBackendAdapter(config: BackendAdapterConfig = {}): BackendAdapter {
  const tokenStorage = config.tokenStorage || new BrowserTokenStorage();
  const fetchTransport =
    config.fetch ||
    ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init));

  const getBaseUrl = (): string => {
    if (config.baseUrl !== undefined) {
      return config.baseUrl;
    }
    if (typeof window === "undefined") {
      return process.env.BACKEND_URL || "http://127.0.0.1:8000";
    }
    return process.env.NEXT_PUBLIC_BASE_PATH || "";
  };

  const getAvatarBaseUrl = (): string => {
    if (config.baseUrl !== undefined) {
      return config.baseUrl;
    }
    if (typeof window === "undefined") {
      return process.env.BACKEND_URL || "http://127.0.0.1:8000";
    }
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    }
    const origin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    return `${origin}${basePath}`;
  };

  const unauthorizedListeners = new Set<() => void>();

  const onUnauthorized = (callback: () => void): (() => void) => {
    unauthorizedListeners.add(callback);
    return () => {
      unauthorizedListeners.delete(callback);
    };
  };

  const dispatchUnauthorized = (): void => {
    tokenStorage.clearToken();
    for (const listener of unauthorizedListeners) {
      try {
        listener();
      } catch (err) {
        console.error("Error in onUnauthorized listener:", err);
      }
    }
  };

  const formatUrl = (path: string): string => {
    const base = getBaseUrl().replace(/\/+$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  const request = async <T = unknown>(
    path: string,
    init: RequestInit & { json?: unknown } = {}
  ): Promise<T> => {
    const headers = new Headers(init.headers);
    const token = tokenStorage.getToken();

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let body = init.body;
    if (init.json !== undefined) {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      body = JSON.stringify(init.json);
    }

    const pathname = path.split("?")[0];
    const isExempt401 = pathname === "/api/users/token";
    let res: Response;

    try {
      res = await fetchTransport(formatUrl(path), { ...init, headers, body });
    } catch (networkError: unknown) {
      if (networkError instanceof Error) {
        throw normalizeBackendError(0, networkError.message, "Network Error");
      }
      throw normalizeBackendError(0, "A network error occurred. Please check your connection.");
    }

    if (res.status === 401 && !isExempt401) {
      dispatchUnauthorized();
    }

    if (!res.ok) {
      let payload: unknown = null;
      try {
        const text = await res.text();
        try {
          payload = JSON.parse(text);
        } catch {
          payload = text;
        }
      } catch {
        payload = null;
      }
      throw normalizeBackendError(res.status, payload, res.statusText);
    }

    if (res.status === 204) {
      return undefined as unknown as T;
    }

    const text = await res.text();
    if (!text || text.trim() === "") {
      return undefined as unknown as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  };

  const posts = {
    async getPosts({ skip = 0, limit = 10 }: GetPostsParams = {}): Promise<NormalizedPaginatedPosts> {
      const data = await request<NormalizedPaginatedPosts>(`/api/posts?skip=${skip}&limit=${limit}`);
      return normalizePaginatedPosts(data, getAvatarBaseUrl());
    },

    async getPostById(postId: string | number): Promise<NormalizedPost> {
      const data = await request<NormalizedPost>(`/api/posts/${postId}`);
      return normalizePost(data, getAvatarBaseUrl());
    },

    async getUserPosts(
      userId: string | number,
      { skip = 0, limit = 10 }: GetPostsParams = {}
    ): Promise<NormalizedPaginatedPosts> {
      const data = await request<NormalizedPaginatedPosts>(
        `/api/users/${userId}/posts?skip=${skip}&limit=${limit}`
      );
      return normalizePaginatedPosts(data, getAvatarBaseUrl());
    },

    async createPost(payload: CreatePostPayload): Promise<NormalizedPost> {
      const data = await request<NormalizedPost>("/api/posts", {
        method: "POST",
        json: payload,
      });
      return normalizePost(data, getAvatarBaseUrl());
    },

    async updatePost(postId: string | number, payload: UpdatePostPayload): Promise<NormalizedPost> {
      const data = await request<NormalizedPost>(`/api/posts/${postId}`, {
        method: "PATCH",
        json: payload,
      });
      return normalizePost(data, getAvatarBaseUrl());
    },

    async deletePost(postId: string | number): Promise<void> {
      await request<void>(`/api/posts/${postId}`, {
        method: "DELETE",
      });
    },
  };

  const updateProfile = async (
    userId: string | number,
    payload: UpdateProfilePayload
  ): Promise<NormalizedUser> => {
    const data = await request<NormalizedUser>(`/api/users/${userId}`, {
      method: "PATCH",
      json: payload,
    });
    return normalizeUser(data, getAvatarBaseUrl());
  };

  const uploadProfilePicture = async (
    userId: string | number,
    file: File
  ): Promise<NormalizedUser> => {
    const formData = new FormData();
    formData.append("file", file);

    const data = await request<NormalizedUser>(`/api/users/${userId}/picture`, {
      method: "PATCH",
      body: formData,
    });
    return normalizeUser(data, getAvatarBaseUrl());
  };

  const deleteAccount = async (userId: string | number): Promise<void> => {
    await request<void>(`/api/users/${userId}`, {
      method: "DELETE",
    });
  };

  const users = {
    async getCurrentUser(): Promise<NormalizedUser> {
      const data = await request<NormalizedUser>("/api/users/me");
      return normalizeUser(data, getAvatarBaseUrl());
    },

    async getUserById(userId: string | number): Promise<NormalizedUser> {
      const data = await request<NormalizedUser>(`/api/users/${userId}`);
      return normalizeUser(data, getAvatarBaseUrl());
    },

    updateProfile,

    uploadProfilePicture,

    async changePassword(payload: ChangePasswordPayload): Promise<void> {
      await request<void>("/api/users/me/password", {
        method: "PATCH",
        json: {
          current_password: payload.current_password,
          new_password: payload.new_password,
        },
      });
    },

    deleteAccount,
  };

  const auth = {
    async login(emailOrUsername: string, password: string): Promise<AuthTokenResponse> {
      const formData = new FormData();
      formData.append("username", emailOrUsername);
      formData.append("password", password);

      return request<AuthTokenResponse>("/api/users/token", {
        method: "POST",
        body: formData,
      });
    },

    async register(payload: RegisterPayload): Promise<NormalizedUser> {
      const data = await request<NormalizedUser>("/api/users", {
        method: "POST",
        json: payload,
      });
      return normalizeUser(data, getAvatarBaseUrl());
    },

    async forgotPassword(email: string): Promise<void> {
      await request<void>("/api/users/forgot-password", {
        method: "POST",
        json: { email },
      });
    },

    async resetPassword(payload: ResetPasswordPayload): Promise<void> {
      await request<void>("/api/users/reset-password", {
        method: "POST",
        json: payload,
      });
    },
  };

  return {
    getToken: () => tokenStorage.getToken(),
    setToken: (token: string) => tokenStorage.setToken(token),
    clearToken: () => tokenStorage.clearToken(),
    onUnauthorized,
    posts,
    users,
    auth,
  };
}

export const backend = createBackendAdapter();
