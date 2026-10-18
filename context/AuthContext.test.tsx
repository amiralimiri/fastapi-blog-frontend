import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "./AuthContext";
import { backend, createBackendAdapter } from "@/lib/backend";

const mockUser = {
  id: 42,
  username: "testuser",
  email: "test@example.com",
  image_file: null,
  image_path: "/static/default.jpg",
};

function TestConsumer() {
  const { user, isLoading, login, logout, updateUser } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? "loading" : "ready"}</div>
      <div data-testid="user">{user ? user.username : "anonymous"}</div>
      <div data-testid="email">{user?.email || "no-email"}</div>
      <button onClick={() => login("valid-token-xyz")}>Login Button</button>
      <button onClick={() => logout()}>Logout Button</button>
      <button
        onClick={() =>
          updateUser({
            ...mockUser,
            username: "updated_user",
          })
        }
      >
        Update Button
      </button>
    </div>
  );
}

describe("context/AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("throws an error when useAuth is used outside AuthProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      "useAuth must be used within an AuthProvider"
    );
    spy.mockRestore();
  });

  it("initializes with anonymous user when no token exists", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
  });

  it("auto-fetches and sets user when a valid token exists in storage", async () => {
    backend.setToken("existing-jwt-token");
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockUser), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("testuser");
    expect(screen.getByTestId("email")).toHaveTextContent("test@example.com");
  });

  it("clears token and sets user to null if user fetch returns 401", async () => {
    const router = useRouter();
    backend.setToken("expired-token");
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Token expired" }), {
        status: 401,
      })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
    expect(backend.getToken()).toBeNull();
    expect(router.replace).toHaveBeenCalledWith("/login");
  });

  it("retains stored credentials/token when a non-401 error (network error or 500) occurs", async () => {
    const router = useRouter();
    backend.setToken("valid-token-on-server-error");
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
    expect(backend.getToken()).toBe("valid-token-on-server-error");
    expect(router.replace).not.toHaveBeenCalledWith("/login");
  });

  it("handles login flow and updates state", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockUser), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Login Button"));

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("testuser");
    });
    expect(backend.getToken()).toBe("valid-token-xyz");
  });

  it("handles logout flow and clears state", async () => {
    backend.setToken("my-token");
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockUser), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("testuser");
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Logout Button"));

    expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
    expect(backend.getToken()).toBeNull();
  });

  it("updates user state immediately via updateUser", async () => {
    backend.setToken("my-token");
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockUser), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("testuser");
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Update Button"));

    expect(screen.getByTestId("user")).toHaveTextContent("updated_user");
  });

  it("subscribes to onUnauthorized and redirects to /login on 401 revocation", async () => {
    const router = useRouter();
    let triggerUnauthorized: (() => void) | null = null;
    const customAdapter = createBackendAdapter({
      tokenStorage: {
        getToken: () => "active-session-token",
        setToken: vi.fn(),
        clearToken: vi.fn(),
      },
      fetch: vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockUser), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      ),
    });

    const origOnUnauthorized = customAdapter.onUnauthorized.bind(customAdapter);
    vi.spyOn(customAdapter, "onUnauthorized").mockImplementation((cb) => {
      triggerUnauthorized = cb;
      return origOnUnauthorized(cb);
    });

    render(
      <AuthProvider adapter={customAdapter}>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("testuser");
    });

    // Fire the onUnauthorized subscription callback
    act(() => {
      triggerUnauthorized?.();
    });

    expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
    expect(router.replace).toHaveBeenCalledWith("/login");
  });

  it("unsubscribes from onUnauthorized when AuthProvider unmounts", () => {
    const unsubscribeSpy = vi.fn();
    const customAdapter = createBackendAdapter({
      tokenStorage: {
        getToken: () => null,
        setToken: vi.fn(),
        clearToken: vi.fn(),
      },
    });
    vi.spyOn(customAdapter, "onUnauthorized").mockReturnValue(unsubscribeSpy);

    const { unmount } = render(
      <AuthProvider adapter={customAdapter}>
        <TestConsumer />
      </AuthProvider>
    );

    expect(customAdapter.onUnauthorized).toHaveBeenCalled();
    unmount();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  describe("mockRouter isolation across tests", () => {
    it("records a navigation call in test 1", () => {
      const router = useRouter();
      router.replace("/test-path-1");
      expect(router.replace).toHaveBeenCalledWith("/test-path-1");
    });

    it("resets router mock calls so test 2 starts with clean history", () => {
      const router = useRouter();
      expect(router.replace).not.toHaveBeenCalled();
    });
  });
});
