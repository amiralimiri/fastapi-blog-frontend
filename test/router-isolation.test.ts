import { describe, it, expect } from "vitest";
import { useRouter } from "next/navigation";

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
