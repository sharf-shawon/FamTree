import { describe, it, expect } from "vitest";
import { createTreeSchema, personSchema, inviteSchema, relationshipSchema } from "@/lib/validations";

describe("createTreeSchema", () => {
  it("accepts valid tree data", () => {
    const result = createTreeSchema.safeParse({ name: "Smith Family", isPrivate: true });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createTreeSchema.safeParse({ name: "", isPrivate: true });
    expect(result.success).toBe(false);
  });

  it("defaults isPrivate to true", () => {
    const result = createTreeSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPrivate).toBe(true);
    }
  });

  it("rejects names that are too long", () => {
    const result = createTreeSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("personSchema", () => {
  it("accepts minimal valid person", () => {
    const result = personSchema.safeParse({ firstName: "Alice" });
    expect(result.success).toBe(true);
  });

  it("rejects empty first name", () => {
    const result = personSchema.safeParse({ firstName: "" });
    expect(result.success).toBe(false);
  });

  it("defaults gender to UNKNOWN", () => {
    const result = personSchema.safeParse({ firstName: "Bob" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gender).toBe("UNKNOWN");
    }
  });

  it("defaults isLiving to true", () => {
    const result = personSchema.safeParse({ firstName: "Carol" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isLiving).toBe(true);
    }
  });
});

describe("inviteSchema", () => {
  it("accepts valid email and role", () => {
    const result = inviteSchema.safeParse({ email: "test@example.com", role: "VIEWER" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = inviteSchema.safeParse({ email: "not-an-email", role: "VIEWER" });
    expect(result.success).toBe(false);
  });

  it("rejects OWNER role (cannot invite as owner)", () => {
    const result = inviteSchema.safeParse({ email: "test@example.com", role: "OWNER" });
    expect(result.success).toBe(false);
  });

  it("accepts EDITOR, CONTRIBUTOR, VIEWER roles", () => {
    const roles = ["EDITOR", "CONTRIBUTOR", "VIEWER"] as const;
    for (const role of roles) {
      const result = inviteSchema.safeParse({ email: "x@example.com", role });
      expect(result.success).toBe(true);
    }
  });
});

describe("relationshipSchema", () => {
  const validCuid = "cuid1234567890abcdef12";

  it("accepts valid relationship", () => {
    const result = relationshipSchema.safeParse({
      subjectId: validCuid,
      objectId: validCuid + "x",
      type: "PARENT_CHILD",
    });
    expect(result.success).toBe(true);
  });

  it("defaults isUncertain to false", () => {
    const result = relationshipSchema.safeParse({
      subjectId: validCuid,
      objectId: validCuid + "x",
      type: "PARTNER",
    });
    if (result.success) {
      expect(result.data.isUncertain).toBe(false);
    }
  });
});
