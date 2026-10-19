import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import Login from "./page";
import { AuthProvider } from "@/context/AuthContext";
import { backend } from "@/lib/backend";
import { toast } from "sonner";

describe("app/login/page", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders login form with email/username, password fields and submit button", () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    expect(screen.getByRole("heading", { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Login$/i })).toBeInTheDocument();
  });

  it("submits credentials successfully and logs in", async () => {
    // 1st fetch: token request; 2nd fetch: /api/users/me inside AuthContext.login
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "jwt-test-token-777", token_type: "bearer" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 1,
            username: "tester",
            email: "test@example.com",
            image_path: "/static/default.jpg",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "secret1234");
    await user.click(screen.getByRole("button", { name: /^Login$/i }));

    await waitFor(() => {
      expect(backend.getToken()).toBe("jwt-test-token-777");
    });
    expect(toast.success).toHaveBeenCalledWith("Welcome back!");
  });

  it("submits username credentials successfully and logs in", async () => {
    const loginSpy = vi.spyOn(backend.auth, "login").mockResolvedValueOnce({
      access_token: "jwt-user-token-888",
      token_type: "bearer",
    });
    vi.spyOn(backend.users, "getCurrentUser").mockResolvedValueOnce({
      id: 2,
      username: "myusername",
      email: "user@example.com",
      avatarUrl: "/default.jpg",
      image_path: "/default.jpg",
    });

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("you@example.com"), "myusername");
    await user.type(screen.getByPlaceholderText("••••••••"), "secret1234");
    await user.click(screen.getByRole("button", { name: /^Login$/i }));

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith("myusername", "secret1234");
    });
    expect(toast.success).toHaveBeenCalledWith("Welcome back!");
  });

  it("shows error feedback when login fails", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Incorrect email or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("you@example.com"), "wrong@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /^Login$/i }));

    await waitFor(() => {
      expect(screen.getByText("Incorrect email or password")).toBeInTheDocument();
    });
    expect(toast.error).toHaveBeenCalledWith("Incorrect email or password");
    expect(backend.getToken()).toBeNull();
  });

  it("displays BackendError on 401 credential exchange without triggering unauthorized navigation", async () => {
    const router = useRouter();
    // 401 returned from /api/users/token (invalid password)
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Incorrect username or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("you@example.com"), "existing@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /^Login$/i }));

    await waitFor(() => {
      expect(screen.getByText("Incorrect username or password")).toBeInTheDocument();
    });
    expect(toast.error).toHaveBeenCalledWith("Incorrect username or password");
    // Verify that router.replace was NOT called with "/login" (no unwanted navigation loop)
    expect(router.replace).not.toHaveBeenCalledWith("/login");
    expect(backend.getToken()).toBeNull();
  });
});
