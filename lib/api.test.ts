import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  apiPath,
  getToken,
  setToken,
  clearToken,
  getErrorMessage,
  formatDate,
  apiFetch,
} from "./api";

describe("lib/api.ts", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("apiPath", () => {
    it("returns correct path with default base path", () => {
      expect(apiPath("/api/posts")).toBe("/api/posts");
    });
  });

  describe("token storage", () => {
    it("sets, gets, and clears access token", () => {
      expect(getToken()).toBeNull();
      setToken("my-secret-token-123");
      expect(getToken()).toBe("my-secret-token-123");
      clearToken();
      expect(getToken()).toBeNull();
    });
  });

  describe("getErrorMessage", () => {
    it("handles simple string error", () => {
      expect(getErrorMessage("Something failed")).toBe("Something failed");
    });

    it("handles FastAPI detail string", () => {
      expect(getErrorMessage({ detail: "User not found" })).toBe("User not found");
    });

    it("handles FastAPI array of validation error objects", () => {
      const errorObj = {
        detail: [
          { loc: ["body", "title"], msg: "Title is required" },
          { loc: ["body", "content"], msg: "Content cannot be empty" },
        ],
      };
      expect(getErrorMessage(errorObj)).toBe(
        "Title is required. Content cannot be empty"
      );
    });

    it("handles generic Error object with message", () => {
      expect(getErrorMessage(new Error("Connection timed out"))).toBe(
        "Connection timed out"
      );
    });

    it("returns default fallback for null or empty errors", () => {
      expect(getErrorMessage(null)).toBe("An error occurred. Please try again.");
      expect(getErrorMessage({})).toBe("An error occurred. Please try again.");
    });
  });

  describe("formatDate", () => {
    it("formats ISO date string nicely", () => {
      const result = formatDate("2026-03-15T12:00:00Z");
      expect(result).toContain("2026");
      expect(result).toContain("March");
    });

    it("handles invalid date string gracefully without throwing", () => {
      expect(formatDate("invalid-date-string")).toBe("Invalid Date");
    });
  });

  describe("apiFetch", () => {
    it("attaches Authorization header when token is present", async () => {
      setToken("test-jwt-token");
      const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
      global.fetch = mockFetch;

      await apiFetch("/api/posts");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe("/api/posts");
      const headers = callArgs[1]?.headers as Headers;
      expect(headers.get("Authorization")).toBe("Bearer test-jwt-token");
    });

    it("does not attach Authorization header when token is missing", async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
      global.fetch = mockFetch;

      await apiFetch("/api/posts");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const headers = mockFetch.mock.calls[0][1]?.headers as Headers;
      expect(headers.get("Authorization")).toBeNull();
    });

    it("preserves custom headers", async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response());
      global.fetch = mockFetch;

      await apiFetch("/api/posts", {
        headers: {
          "Content-Type": "application/json",
          "X-Custom": "custom-val",
        },
      });

      const headers = mockFetch.mock.calls[0][1]?.headers as Headers;
      expect(headers.get("Content-Type")).toBe("application/json");
      expect(headers.get("X-Custom")).toBe("custom-val");
    });
  });
});
