import { describe, it, expect } from "vitest";
import { cn, formatDate } from "./utils";

describe("lib/utils.ts -> cn()", () => {
  it("merges simple class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    const isPrimary = true;
    const isSmall = false;
    expect(cn("btn", isPrimary && "btn-primary", isSmall && "btn-sm")).toBe(
      "btn btn-primary"
    );
  });

  it("resolves conflicting Tailwind classes by giving precedence to the last one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});

describe("lib/utils.ts -> formatDate()", () => {
  it("formats ISO date string into readable US date", () => {
    const formatted = formatDate("2026-03-15T12:00:00Z");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("March");
  });

  it("handles invalid date string gracefully without throwing", () => {
    expect(formatDate("invalid-date-string")).toBe("Invalid Date");
  });
});
