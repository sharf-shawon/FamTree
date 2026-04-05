import { describe, it, expect } from "vitest";
import { canPerform, ROLE_PERMISSIONS } from "@/types";

describe("canPerform", () => {
  it("owner can perform all actions", () => {
    const ownerPerms = ROLE_PERMISSIONS["OWNER"];
    for (const action of ownerPerms) {
      expect(canPerform("OWNER", action)).toBe(true);
    }
  });

  it("viewer cannot write", () => {
    expect(canPerform("VIEWER", "write")).toBe(false);
    expect(canPerform("VIEWER", "delete")).toBe(false);
    expect(canPerform("VIEWER", "invite")).toBe(false);
  });

  it("viewer can read and export", () => {
    expect(canPerform("VIEWER", "read")).toBe(true);
    expect(canPerform("VIEWER", "export")).toBe(true);
  });

  it("contributor can write but not delete trees", () => {
    expect(canPerform("CONTRIBUTOR", "write")).toBe(true);
    expect(canPerform("CONTRIBUTOR", "delete_tree")).toBe(false);
    expect(canPerform("CONTRIBUTOR", "invite")).toBe(false);
  });

  it("editor can invite but not delete trees", () => {
    expect(canPerform("EDITOR", "invite")).toBe(false); // editors invite via owner
    expect(canPerform("EDITOR", "write")).toBe(true);
    expect(canPerform("EDITOR", "delete")).toBe(true);
  });

  it("unknown action returns false", () => {
    expect(canPerform("OWNER", "nonexistent_action")).toBe(false);
  });
});
