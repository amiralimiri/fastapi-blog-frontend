import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { setToken } from "@/lib/api";

const mockAuthUser = {
  id: 1,
  username: "johndoe",
  email: "john@example.com",
  image_file: null,
  image_path: "/static/default.jpg",
};

describe("components/AppShell", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders header brand and guest navigation links when logged out", async () => {
    render(
      <AuthProvider>
        <AppShell>
          <div data-testid="page-child">Home Content</div>
        </AppShell>
      </AuthProvider>
    );

    expect(screen.getByText("FastAPI Blog")).toBeInTheDocument();
    expect(screen.getByTestId("page-child")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Login")).toBeInTheDocument();
      expect(screen.getByText("Register")).toBeInTheDocument();
    });

    expect(screen.queryByText("New Post")).not.toBeInTheDocument();
  });

  it("renders authenticated navigation and username when user is logged in", async () => {
    setToken("valid-token");
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockAuthUser), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <AuthProvider>
        <AppShell>
          <div>Dashboard</div>
        </AppShell>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("johndoe")).toBeInTheDocument();
      expect(screen.getByText("New Post")).toBeInTheDocument();
    });

    expect(screen.queryByText("Login")).not.toBeInTheDocument();
    expect(screen.queryByText("Register")).not.toBeInTheDocument();
  });

  it("opens theme dropdown and switches theme", async () => {
    render(
      <AuthProvider>
        <AppShell>
          <div>Child</div>
        </AppShell>
      </AuthProvider>
    );

    const user = userEvent.setup();
    const caret = screen.getByLabelText("Theme options");
    await user.click(caret);

    const darkOption = screen.getByText("Dark");
    await user.click(darkOption);

    expect(document.documentElement.dataset.bsTheme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("opens New Post modal when authenticated user clicks New Post button", async () => {
    setToken("valid-token");
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockAuthUser), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <AuthProvider>
        <AppShell>
          <div>Child</div>
        </AppShell>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("New Post")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("New Post"));

    // Modal should now be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Content/i)).toBeInTheDocument();
  });
});
