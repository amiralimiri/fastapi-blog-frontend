import { describe, it, expect } from "vitest";
import { BackendError, normalizeBackendError } from "./errors";

describe("Seam 1: BackendError Normalizer", () => {
  it("creates a BackendError instance with status, message, and details", () => {
    const error = new BackendError(400, "Bad request", { field: ["is required"] });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("BackendError");
    expect(error.status).toBe(400);
    expect(error.message).toBe("Bad request");
    expect(error.details).toEqual({ field: ["is required"] });
  });

  it("normalizes string detail responses", () => {
    const error = normalizeBackendError(401, { detail: "Incorrect username or password" });
    expect(error.status).toBe(401);
    expect(error.message).toBe("Incorrect username or password");
    expect(error.details).toBeNull();
  });

  it("normalizes Pydantic validation error arrays with loc and msg", () => {
    const payload = {
      detail: [
        { loc: ["body", "email"], msg: "value is not a valid email address", type: "value_error" },
        { loc: ["body", "password"], msg: "ensure this value has at least 8 characters", type: "value_error" },
      ],
    };

    const error = normalizeBackendError(422, payload);
    expect(error.status).toBe(422);
    expect(error.message).toBe("value is not a valid email address. ensure this value has at least 8 characters");
    expect(error.details).toEqual({
      email: ["value is not a valid email address"],
      password: ["ensure this value has at least 8 characters"],
    });
  });

  it("normalizes string array detail formats", () => {
    const payload = {
      detail: ["First error", "Second error"],
    };

    const error = normalizeBackendError(400, payload);
    expect(error.status).toBe(400);
    expect(error.message).toBe("First error. Second error");
    expect(error.details).toBeNull();
  });

  it("normalizes non-JSON raw HTML or plain text error payloads", () => {
    const rawHtml = "<html><body>502 Bad Gateway</body></html>";
    const error = normalizeBackendError(502, rawHtml, "Bad Gateway");
    expect(error.status).toBe(502);
    expect(error.message).toBe("Bad Gateway");
  });

  it("handles null, empty, or unexpected payloads with reasonable fallbacks", () => {
    const error = normalizeBackendError(500, null, "Internal Server Error");
    expect(error.status).toBe(500);
    expect(error.message).toBe("Internal Server Error");
  });
});
