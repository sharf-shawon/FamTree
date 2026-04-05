import { z } from "zod";

// ─── Tree schemas ─────────────────────────────────────────────────────────────

export const createTreeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(true),
});

export const updateTreeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
});

// ─── Person schemas ───────────────────────────────────────────────────────────

export const personSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().max(100).optional(),
  maidenName: z.string().max(100).optional(),
  aliases: z.array(z.string().max(100)).default([]),
  gender: z
    .enum(["MALE", "FEMALE", "NON_BINARY", "OTHER", "UNKNOWN"])
    .default("UNKNOWN"),
  birthDate: z.string().max(50).optional(),
  birthDateApproximate: z.boolean().default(false),
  birthPlace: z.string().max(200).optional(),
  deathDate: z.string().max(50).optional(),
  deathDateApproximate: z.boolean().default(false),
  deathPlace: z.string().max(200).optional(),
  isLiving: z.boolean().default(true),
  isPrivate: z.boolean().default(false),
  hideDetails: z.boolean().default(false),
  notes: z.string().max(5000).optional(),
  sourceRefs: z.array(z.string().max(500)).default([]),
  profileImageUrl: z.string().url().optional().or(z.literal("")),
});

// ─── Relationship schemas ─────────────────────────────────────────────────────

export const relationshipSchema = z.object({
  subjectId: z.string().cuid(),
  objectId: z.string().cuid(),
  type: z.enum(["PARENT_CHILD", "PARTNER", "SIBLING"]),
  subtype: z.string().max(50).optional(),
  isUncertain: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
  marriageDate: z.string().max(50).optional(),
  marriageDateApproximate: z.boolean().default(false),
  marriagePlace: z.string().max(200).optional(),
  endDate: z.string().max(50).optional(),
  endDateApproximate: z.boolean().default(false),
  endPlace: z.string().max(200).optional(),
});

// ─── Invitation schemas ───────────────────────────────────────────────────────

export const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["EDITOR", "CONTRIBUTOR", "VIEWER"]),
});

// ─── Export schemas ───────────────────────────────────────────────────────────

export const exportSchema = z.object({
  format: z.enum(["PDF", "PNG", "JSON"]),
});

// ─── Tree link schemas ────────────────────────────────────────────────────────

export const treeLinkSchema = z.object({
  targetTreeId: z.string().cuid(),
  message: z.string().max(1000).optional(),
  linkedPeople: z.array(
    z.object({
      sourcePersonId: z.string().cuid(),
      targetPersonId: z.string().cuid(),
    })
  ).optional(),
});
