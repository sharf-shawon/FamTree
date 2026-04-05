import type { TreeRole } from "@prisma/client";

// Permission actions that can be checked
export type PermissionAction =
  | "read"
  | "write"
  | "delete"
  | "invite"
  | "delete_tree"
  | "export"
  | "manage_members"
  | "branch";

// Map of role -> allowed actions
export const ROLE_PERMISSIONS: Record<TreeRole, PermissionAction[]> = {
  OWNER: [
    "read",
    "write",
    "delete",
    "invite",
    "delete_tree",
    "export",
    "manage_members",
    "branch",
  ],
  EDITOR: ["read", "write", "delete", "export", "branch"],
  CONTRIBUTOR: ["read", "write", "export", "branch"],
  VIEWER: ["read", "export", "branch"],
};

/** Check if a role has permission for the given action. */
export function canPerform(role: TreeRole | string, action: string): boolean {
  const perms = ROLE_PERMISSIONS[role as TreeRole];
  if (!perms) return false;
  return (perms as string[]).includes(action);
}

/** Role weight for hierarchy comparisons. */
const ROLE_WEIGHT: Record<TreeRole, number> = {
  OWNER: 4,
  EDITOR: 3,
  CONTRIBUTOR: 2,
  VIEWER: 1,
};

/** Return true if `actual` role meets or exceeds the `required` role level. */
export function hasMinimumRole(
  actual: TreeRole | string,
  required: TreeRole | string
): boolean {
  return (ROLE_WEIGHT[actual as TreeRole] ?? 0) >= (ROLE_WEIGHT[required as TreeRole] ?? 0);
}
