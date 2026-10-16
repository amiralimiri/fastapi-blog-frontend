import { describe, it, expect, beforeEach, vi } from "vitest";
import { postsService, usersService, authService } from "./index";

describe("lib/services", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("postsService", () => {
    it("getPosts returns paginated posts on success", async () => {
      const mockData = { posts: [], total: 0, skip: 0, limit: 10, has_more: false };
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await postsService.getPosts({ skip: 0, limit: 10 });
      expect(res).toEqual(mockData);
    });

    it("getPosts throws formatted error message on failure", async () => {
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Database connection failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );

      await expect(postsService.getPosts()).rejects.toThrow("Database connection failed");
    });

    it("getPostById returns single post", async () => {
      const mockPost = { id: 1, title: "Test", content: "Content" };
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockPost), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await postsService.getPostById(1);
      expect(res).toEqual(mockPost);
    });

    it("deletePost deletes post successfully", async () => {
      global.fetch = vi.fn().mockResolvedValue(
        new Response(null, { status: 204 })
      );

      await expect(postsService.deletePost(1)).resolves.toBeUndefined();
    });

    it("createPost posts new article and returns created post", async () => {
      const created = { id: 10, title: "Title", content: "Content" };
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(created), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await postsService.createPost({ title: "Title", content: "Content" });
      expect(res).toEqual(created);
    });

    it("updatePost updates post and returns updated post", async () => {
      const updated = { id: 10, title: "New Title", content: "New Content" };
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(updated), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await postsService.updatePost(10, { title: "New Title" });
      expect(res).toEqual(updated);
    });

    it("getUserPosts returns posts by user", async () => {
      const mockData = { posts: [], total: 0, skip: 0, limit: 10, has_more: false };
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await postsService.getUserPosts(1);
      expect(res).toEqual(mockData);
    });
  });

  describe("usersService", () => {
    it("getCurrentUser returns user profile", async () => {
      const mockUser = { id: 1, username: "user1", email: "u@test.com" };
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockUser), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await usersService.getCurrentUser();
      expect(res).toEqual(mockUser);
    });

    it("getUserById returns user profile by id", async () => {
      const mockUser = { id: 2, username: "user2", email: "u2@test.com" };
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockUser), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await usersService.getUserById(2);
      expect(res).toEqual(mockUser);
    });

    it("updateProfile sends patch and returns updated profile", async () => {
      const updatedUser = { id: 1, username: "new_name", email: "new@test.com" };
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(updatedUser), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await usersService.updateProfile(1, { username: "new_name" });
      expect(res).toEqual(updatedUser);
    });

    it("changePassword sends password update request", async () => {
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await expect(
        usersService.changePassword({ new_password: "newPassword123" })
      ).resolves.toBeUndefined();
    });

    it("deleteAccount deletes user account", async () => {
      global.fetch = vi.fn().mockResolvedValue(
        new Response(null, { status: 204 })
      );

      await expect(usersService.deleteAccount(1)).resolves.toBeUndefined();
    });
  });

  describe("authService", () => {
    it("login returns access token", async () => {
      const mockToken = { access_token: "jwt-token-123", token_type: "bearer" };
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockToken), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await authService.login("user@test.com", "password123");
      expect(res).toEqual(mockToken);
    });

    it("register creates new user account", async () => {
      const newUser = { id: 1, username: "newUser", email: "new@user.com" };
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(newUser), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await authService.register({
        username: "newUser",
        email: "new@user.com",
        password: "password123",
      });
      expect(res).toEqual(newUser);
    });

    it("forgotPassword sends password reset email", async () => {
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await expect(
        authService.forgotPassword("user@example.com")
      ).resolves.toBeUndefined();
    });

    it("resetPassword sends new password with token", async () => {
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await expect(
        authService.resetPassword({
          token: "valid-token",
          new_password: "newPassword123!",
        })
      ).resolves.toBeUndefined();
    });
  });
});
