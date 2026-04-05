import { TreeRole } from "@prisma/client";
import { prisma } from "@/lib/db";

// ─── Role hierarchy ──────────────────────────────────────────────────────────

const ROLE_WEIGHT: Record<TreeRole, number> = {
  OWNER: 4,
  EDITOR: 3,
  CONTRIBUTOR: 2,
  VIEWER: 1,
};

export function hasMinimumRole(
  actual: TreeRole,
  required: TreeRole
): boolean {
  return ROLE_WEIGHT[actual] >= ROLE_WEIGHT[required];
}

// ─── Membership lookup ───────────────────────────────────────────────────────

export async function getTreeMembership(treeId: string, userId: string) {
  return prisma.treeMembership.findUnique({
    where: { treeId_userId: { treeId, userId } },
  });
}

export async function requireTreeAccess(
  treeId: string,
  userId: string,
  minimumRole: TreeRole = "VIEWER"
) {
  const membership = await getTreeMembership(treeId, userId);
  if (!membership) {
    throw new PermissionError("You do not have access to this tree.");
  }
  if (!hasMinimumRole(membership.role, minimumRole)) {
    throw new PermissionError(
      `This action requires the ${minimumRole} role or higher.`
    );
  }
  return membership;
}

export async function requireTreeOwner(treeId: string, userId: string) {
  return requireTreeAccess(treeId, userId, "OWNER");
}

// ─── Tree existence check ────────────────────────────────────────────────────

export async function requireTree(treeId: string) {
  const tree = await prisma.familyTree.findFirst({
    where: { id: treeId, deletedAt: null },
  });
  if (!tree) {
    throw new NotFoundError("Family tree not found.");
  }
  return tree;
}

// ─── Person access ───────────────────────────────────────────────────────────

export async function requirePersonAccess(
  personId: string,
  userId: string,
  minimumRole: TreeRole = "VIEWER"
) {
  const person = await prisma.person.findFirst({
    where: { id: personId, deletedAt: null },
    select: { treeId: true, isPrivate: true },
  });
  if (!person) {
    throw new NotFoundError("Person not found.");
  }
  const membership = await requireTreeAccess(person.treeId, userId, minimumRole);
  return { person, membership };
}

// ─── Custom errors ───────────────────────────────────────────────────────────

export class PermissionError extends Error {
  readonly status = 403;
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

export class NotFoundError extends Error {
  readonly status = 404;
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthError extends Error {
  readonly status = 401;
  constructor(message: string = "Authentication required.") {
    super(message);
    this.name = "AuthError";
  }
}

// ─── Helper to format API errors ─────────────────────────────────────────────

export function apiError(
  err: unknown
): { message: string; status: number } {
  if (
    err instanceof PermissionError ||
    err instanceof NotFoundError ||
    err instanceof ValidationError ||
    err instanceof AuthError
  ) {
    return { message: err.message, status: err.status };
  }
  console.error(err);
  return { message: "Internal server error", status: 500 };
}
