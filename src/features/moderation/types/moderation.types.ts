import { ProfileUpdateEntityType } from "@/features/profile-updates/types/profile-update.types";

export type ModerationActionType = "banned" | "unbanned" | "suspended" | "unsuspended" | "suspension_expired";

export interface ModerationAction {
  id: string;
  entityType: ProfileUpdateEntityType;
  entityId: string;
  actionType: ModerationActionType;
  reason?: string;
  // Only meaningful for 'suspended' rows — when that suspension is due
  // to lift.
  expiresAt?: Date;
  // Undefined for 'suspension_expired' — there's no admin to attribute
  // a system-generated event to.
  performedBy?: string;
  performedByName?: string;
  createdAt: Date;
}

// The current, denormalized status — what a fast login/access check
// reads directly off the entity's own row, not derived from the audit
// trail. See the migration's own comment for why both exist.
export interface ModerationStatus {
  isBanned: boolean;
  isSuspended: boolean;
  suspendedUntil?: Date;
  moderationReason?: string;
}

// True restriction, accounting for a suspension that's technically
// expired but hasn't been cleared by the hourly cron job yet — the
// denormalized isSuspended flag alone isn't sufficient for an access
// check for exactly that reason (see the migration's own comment).
export function isCurrentlyRestricted(status: ModerationStatus): boolean {
  if (status.isBanned) return true;
  if (status.isSuspended && status.suspendedUntil) {
    return status.suspendedUntil.getTime() > Date.now();
  }
  return false;
}
