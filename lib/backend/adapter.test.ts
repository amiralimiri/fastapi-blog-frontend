import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBackendAdapter } from "./adapter";
import { BackendError } from "./errors";
import * as backendModule from "./index";

describe("Backend Adapter Seams 2, 3, 5", () => {
  let mockStorage: {
    token: string | null;
    getToken: () => string | null;
    setToken: (token: string) => void;
    clearToken: () => void;
  };

  it("exports default backend instance and all essential symbols from module root", () => {
    expect(backendModule.backend).toBeDefined();
    expect(backendModule.BackendError).toBe(BackendError);
    expect(typeof backendModule.createBackendAdapter).toBe("function");
    expect(backendModule.backend.posts).toBeDefined();
    expect(backendModule.backend.users).toBeDefined();
    expect(backendModule.backend.auth).toBeDefined();
  });

  beforeEach(() => {
    mockStorage = {
      token: null,
      getToken() {
        return this.token;
      },
      setToken(token: string) {
        this.token = token;
      },
      clearToken() {
        this.token = null;
      },
    };
  });

  describe("Seam 2: Credential Lifecycle & Token Header Injection", () => {
    it("reads, sets, and clears tokens through custom storage", () => {
      const adapter = createBackendAdapter({
        tokenStorage: mockStorage,
      });

      expect(adapter.getToken()).toBeNull();
      adapter.setToken("test-jwt-token");
      expect(adapter.getToken()).toBe("test-jwt-token");
      expect(mockStorage.token).toBe("test-jwt-token");

      adapter.clearToken();
      expect(adapter.getToken()).toBeNull();
      expect(mockStorage.token).toBeNull();
    });

    it("automatically injects Authorization: Bearer <token> when token is present", async () => {
      mockStorage.token = "auth-token-123";
      const customFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: 1, username: "john" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      await adapter.users.getCurrentUser();

      expect(customFetch).toHaveBeenCalledTimes(1);
      const [, init] = customFetch.mock.calls[0];
      const headers = new Headers(init.headers);
      expect(headers.get("Authorization")).toBe("Bearer auth-token-123");
    });

    it("does not inject Authorization header when token is absent", async () => {
      mockStorage.token = null;
      const customFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: 1, username: "john" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      await adapter.users.getUserById(1);

      expect(customFetch).toHaveBeenCalledTimes(1);
      const [, init] = customFetch.mock.calls[0];
      const headers = new Headers(init.headers);
      expect(headers.has("Authorization")).toBe(false);
    });
  });

  describe("Seam 3: Centralized Unauthorized (401) Event Seam", () => {
    it("clears token and dispatches onUnauthorized callbacks on 401 for protected endpoints", async () => {
      mockStorage.token = "expired-token";
      const customFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Could not validate credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      const unauthorizedSpy = vi.fn();
      const unsubscribe = adapter.onUnauthorized(unauthorizedSpy);

      await expect(adapter.users.getCurrentUser()).rejects.toThrow(BackendError);

      expect(unauthorizedSpy).toHaveBeenCalledTimes(1);
      expect(adapter.getToken()).toBeNull();
      expect(mockStorage.token).toBeNull();

      // Test unsubscribe
      mockStorage.token = "another-token";
      unsubscribe();
      await expect(adapter.users.getCurrentUser()).rejects.toThrow(BackendError);
      expect(unauthorizedSpy).toHaveBeenCalledTimes(1); // not called again
    });

    it("explicitly exempts /api/users/token from firing onUnauthorized callbacks on 401 even with query parameters", async () => {
      mockStorage.token = null;
      const customFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Incorrect username or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      const unauthorizedSpy = vi.fn();
      adapter.onUnauthorized(unauthorizedSpy);

      await expect(adapter.auth.login("wronguser", "wrongpass")).rejects.toThrow(BackendError);

      expect(unauthorizedSpy).not.toHaveBeenCalled();
    });

    it("translates fetch network rejections into BackendError with status 0", async () => {
      const customFetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      await expect(adapter.posts.getPosts()).rejects.toMatchObject({
        name: "BackendError",
        status: 0,
        message: "Failed to fetch",
      });
    });
  });

  describe("Seam 5: Backend Adapter Domain Operations", () => {
    it("posts.getPosts formats skip and limit query params and normalizes authors", async () => {
      const customFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            posts: [
              {
                id: 1,
                user_id: 10,
                title: "Post 1",
                content: "Content 1",
                date_posted: "2026-01-01",
                author: { id: 10, username: "author1", image_path: "/pic.jpg" },
              },
            ],
            total: 1,
            skip: 5,
            limit: 5,
            has_more: false,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      const result = await adapter.posts.getPosts({ skip: 5, limit: 5 });

      expect(customFetch).toHaveBeenCalledWith("https://api.example.com/api/posts?skip=5&limit=5", expect.any(Object));
      expect(result.posts[0].author.avatarUrl).toBe("https://api.example.com/pic.jpg");
      expect(result.total).toBe(1);
    });

    it("posts.getPostById fetches by id and throws BackendError on 404", async () => {
      const customFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Post not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      await expect(adapter.posts.getPostById(999)).rejects.toMatchObject({
        name: "BackendError",
        status: 404,
        message: "Post not found",
      });
      expect(customFetch).toHaveBeenCalledWith("https://api.example.com/api/posts/999", expect.any(Object));
    });

    it("posts.createPost sends POST request with JSON body", async () => {
      const customFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 2,
            user_id: 1,
            title: "New Post",
            content: "Body content",
            date_posted: "2026-02-01",
            author: { id: 1, username: "user" },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        )
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      const post = await adapter.posts.createPost({ title: "New Post", content: "Body content" });

      expect(post.title).toBe("New Post");
      expect(post.author.avatarUrl).toBe("/default.jpg");
      const [url, init] = customFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/posts");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({ title: "New Post", content: "Body content" });
    });

    it("posts.updatePost sends PATCH request with JSON body", async () => {
      const customFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 2,
            user_id: 1,
            title: "Updated Title",
            content: "Body content",
            date_posted: "2026-02-01",
            author: { id: 1, username: "user" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      const updated = await adapter.posts.updatePost(2, { title: "Updated Title" });
      expect(updated.title).toBe("Updated Title");
      const [url, init] = customFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/posts/2");
      expect(init.method).toBe("PATCH");
    });

    it("posts.deletePost sends DELETE request", async () => {
      const customFetch = vi.fn().mockResolvedValue(
        new Response(null, { status: 204 })
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      await adapter.posts.deletePost(2);
      const [url, init] = customFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/posts/2");
      expect(init.method).toBe("DELETE");
    });

    it("posts.getUserPosts queries user's posts with pagination", async () => {
      const customFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ posts: [], total: 0, skip: 0, limit: 10, has_more: false }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      await adapter.posts.getUserPosts(5, { skip: 10, limit: 20 });
      expect(customFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/users/5/posts?skip=10&limit=20",
        expect.any(Object)
      );
    });

    it("users.uploadProfilePicture sends FormData with file", async () => {
      const customFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ id: 1, username: "user", image_path: "/profile_pics/avatar.png" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      const file = new File(["dummy content"], "avatar.png", { type: "image/png" });
      const user = await adapter.users.uploadProfilePicture(1, file);

      expect(user.avatarUrl).toBe("https://api.example.com/profile_pics/avatar.png");
      const [url, init] = customFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/users/1/picture");
      expect(init.method).toBe("PATCH");
      expect(init.body).toBeInstanceOf(FormData);
    });

    it("users.changePassword sends PATCH request with current and new passwords", async () => {
      const customFetch = vi.fn().mockResolvedValue(
        new Response(null, { status: 200 })
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      await adapter.users.changePassword({ current_password: "oldPassword", new_password: "newPassword" });

      const [url, init] = customFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/users/me/password");
      expect(init.method).toBe("PATCH");
      expect(JSON.parse(init.body)).toEqual({
        current_password: "oldPassword",
        new_password: "newPassword",
      });
    });

    it("users.deleteAccount sends DELETE request", async () => {
      const customFetch = vi.fn().mockResolvedValue(
        new Response(null, { status: 204 })
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      await adapter.users.deleteAccount(1);
      const [url, init] = customFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/users/1");
      expect(init.method).toBe("DELETE");
    });

    it("auth.login sends OAuth2 form payload with username parameter", async () => {
      const customFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ access_token: "jwt-token-xyz", token_type: "bearer" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      const response = await adapter.auth.login("user@example.com", "mypassword");

      expect(response.access_token).toBe("jwt-token-xyz");
      const [url, init] = customFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/users/token");
      expect(init.method).toBe("POST");
      expect(init.body).toBeInstanceOf(FormData);
      expect((init.body as FormData).get("username")).toBe("user@example.com");
      expect((init.body as FormData).get("password")).toBe("mypassword");
    });

    it("auth.register sends POST request and normalizes returned User", async () => {
      const customFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ id: 10, username: "newbie", email: "new@example.com" }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        )
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      const user = await adapter.auth.register({
        username: "newbie",
        email: "new@example.com",
        password: "secretpassword",
      });

      expect(user.username).toBe("newbie");
      expect(user.avatarUrl).toBe("/default.jpg");
    });

    it("auth.forgotPassword and resetPassword send correct payloads", async () => {
      const customFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ message: "Success" }), { status: 200 }))
      );

      const adapter = createBackendAdapter({
        baseUrl: "https://api.example.com",
        fetch: customFetch,
        tokenStorage: mockStorage,
      });

      await adapter.auth.forgotPassword("user@example.com");
      expect(customFetch).toHaveBeenLastCalledWith(
        "https://api.example.com/api/users/forgot-password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "user@example.com" }),
        })
      );

      await adapter.auth.resetPassword({ token: "reset-tok", new_password: "newPassWord1" });
      expect(customFetch).toHaveBeenLastCalledWith(
        "https://api.example.com/api/users/reset-password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ token: "reset-tok", new_password: "newPassWord1" }),
        })
      );
    });
  });
});
