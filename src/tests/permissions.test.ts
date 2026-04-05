import { describe, it, expect } from "vitest";
import { hasMinimumRole } from "@/types";

describe("hasMinimumRole", () => {
  it("OWNER passes all role checks", () => {
    expect(hasMinimumRole("OWNER", "OWNER")).toBe(true);
    expect(hasMinimumRole("OWNER", "EDITOR")).toBe(true);
    expect(hasMinimumRole("OWNER", "CONTRIBUTOR")).toBe(true);
    expect(hasMinimumRole("OWNER", "VIEWER")).toBe(true);
  });

  it("EDITOR passes EDITOR, CONTRIBUTOR, VIEWER checks", () => {
    expect(hasMinimumRole("EDITOR", "OWNER")).toBe(false);
    expect(hasMinimumRole("EDITOR", "EDITOR")).toBe(true);
    expect(hasMinimumRole("EDITOR", "CONTRIBUTOR")).toBe(true);
    expect(hasMinimumRole("EDITOR", "VIEWER")).toBe(true);
  });

  it("CONTRIBUTOR passes CONTRIBUTOR and VIEWER checks only", () => {
    expect(hasMinimumRole("CONTRIBUTOR", "OWNER")).toBe(false);
    expect(hasMinimumRole("CONTRIBUTOR", "EDITOR")).toBe(false);
    expect(hasMinimumRole("CONTRIBUTOR", "CONTRIBUTOR")).toBe(true);
    expect(hasMinimumRole("CONTRIBUTOR", "VIEWER")).toBe(true);
  });

  it("VIEWER only passes VIEWER check", () => {
    expect(hasMinimumRole("VIEWER", "OWNER")).toBe(false);
    expect(hasMinimumRole("VIEWER", "EDITOR")).toBe(false);
    expect(hasMinimumRole("VIEWER", "CONTRIBUTOR")).toBe(false);
    expect(hasMinimumRole("VIEWER", "VIEWER")).toBe(true);
  });
});
