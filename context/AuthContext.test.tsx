import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import { setToken, getToken } from "@/lib/api";

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
    setToken("existing-jwt-token");
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
    setToken("expired-token");
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
    expect(getToken()).toBeNull();
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
    expect(getToken()).toBe("valid-token-xyz");
  });

  it("handles logout flow and clears state", async () => {
    setToken("my-token");
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
    expect(getToken()).toBeNull();
  });

  it("updates user state immediately via updateUser", async () => {
    setToken("my-token");
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
});
