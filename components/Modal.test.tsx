import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal, AlertModal } from "./Modal";

describe("components/Modal", () => {
  it("renders modal title and content via portal", () => {
    const handleClose = vi.fn();
    render(
      <Modal title="Test Modal" onClose={handleClose}>
        <p>Modal Body Content</p>
      </Modal>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal Body Content")).toBeInTheDocument();
  });

  it("calls onClose when close icon button is clicked", async () => {
    const handleClose = vi.fn();
    render(
      <Modal title="Test Modal" onClose={handleClose}>
        <p>Body</p>
      </Modal>
    );

    const user = userEvent.setup();
    const closeBtn = screen.getByLabelText("Close");
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <Modal title="Test Modal" onClose={handleClose}>
        <p>Body</p>
      </Modal>
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked, but not when modal card is clicked", () => {
    const handleClose = vi.fn();
    render(
      <Modal title="Test Modal" onClose={handleClose}>
        <p>Inside Content</p>
      </Modal>
    );

    const backdrop = screen.getByRole("dialog");
    // Click inside the card
    fireEvent.mouseDown(screen.getByText("Inside Content"));
    expect(handleClose).not.toHaveBeenCalled();

    // Click directly on the backdrop
    fireEvent.mouseDown(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders with danger style when danger is true", () => {
    render(
      <Modal title="Danger Modal" onClose={vi.fn()} danger>
        <p>Danger body</p>
      </Modal>
    );

    const header = screen.getByText("Danger Modal").closest(".modal-header");
    expect(header).toHaveClass("danger");
  });

  it("renders AlertModal with success kind", async () => {
    const handleClose = vi.fn();
    render(
      <AlertModal
        kind="success"
        message="Operation completed successfully!"
        onClose={handleClose}
      />
    );

    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(
      screen.getByText("Operation completed successfully!")
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByText("Close"));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders AlertModal with error kind", () => {
    render(
      <AlertModal
        kind="error"
        message="Fatal server error"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Fatal server error")).toBeInTheDocument();
    const header = screen.getByText("Error").closest(".modal-header");
    expect(header).toHaveClass("danger");
  });
});
