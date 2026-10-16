import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "./error";

describe("app/error (ErrorBoundary)", () => {
  it("renders error message and calls reset on retry", async () => {
    const handleReset = vi.fn();
    const testError = new Error("Something went wrong with the database");

    render(<ErrorBoundary error={testError} reset={handleReset} />);

    expect(screen.getByText("Something went wrong!")).toBeInTheDocument();
    expect(
      screen.getByText("Something went wrong with the database")
    ).toBeInTheDocument();

    const user = userEvent.setup();
    const retryBtn = screen.getByRole("button", { name: /Try again/i });
    await user.click(retryBtn);

    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
