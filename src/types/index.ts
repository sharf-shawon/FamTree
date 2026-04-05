import type { Session } from "next-auth";
import type {
  FamilyTree,
  Person,
  Relationship,
  TreeMembership,
  User,
  ActivityLog,
  TreeRole,
  Invitation,
} from "@prisma/client";

// ─── Extended types with relations ────────────────────────────────────────────

export type TreeWithMembership = FamilyTree & {
  members: (TreeMembership & { user: Pick<User, "id" | "name" | "image" | "email"> })[];
  _count?: { people: number; relationships: number };
};

export type PersonWithRelationships = Person & {
  relationshipsAsSubject: RelationshipWithPeople[];
  relationshipsAsObject: RelationshipWithPeople[];
};

export type RelationshipWithPeople = Relationship & {
  subject: Pick<Person, "id" | "firstName" | "lastName" | "isLiving" | "hideDetails">;
  object: Pick<Person, "id" | "firstName" | "lastName" | "isLiving" | "hideDetails">;
};

export type ActivityLogWithUser = ActivityLog & {
  user: Pick<User, "id" | "name" | "image" | "email">;
};

export type InvitationWithSender = Invitation & {
  sender: Pick<User, "id" | "name" | "email">;
};

// ─── Auth types ───────────────────────────────────────────────────────────────

export interface AuthSession extends Session {
  user: Session["user"] & {
    id: string;
  };
}

// ─── API response types ───────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

// ─── Tree visualization ───────────────────────────────────────────────────────

export interface TreeNode {
  id: string;
  label: string;
  firstName: string;
  lastName?: string | null;
  gender: string;
  birthDate?: string | null;
  deathDate?: string | null;
  isLiving: boolean;
  profileImageUrl?: string | null;
  isPrivate: boolean;
  hideDetails: boolean;
}

export interface TreeEdge {
  id: string;
  source: string;
  target: string;
  type: "PARENT_CHILD" | "PARTNER" | "SIBLING";
  subtype?: string | null;
  isUncertain: boolean;
}

export interface TreeGraphData {
  nodes: TreeNode[];
  edges: TreeEdge[];
}

// ─── Role permissions ─────────────────────────────────────────────────────────

// Re-export canonical permission helpers from types.ts to avoid duplication
export { ROLE_PERMISSIONS, canPerform, hasMinimumRole, type PermissionAction } from "@/types";
