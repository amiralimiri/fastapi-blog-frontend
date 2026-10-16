import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "./not-found";

describe("app/not-found", () => {
  it("renders 404 message and home link", () => {
    render(<NotFound />);
    expect(screen.getByText("404 - Page Not Found")).toBeInTheDocument();
    const homeLink = screen.getByRole("link", { name: /Back to Home/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
