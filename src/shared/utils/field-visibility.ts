// Generic, reusable across any entity type (facility, organization, user,
// ...). This file has no knowledge of any specific domain — the actual
// rules live in per-domain registry files (e.g.
// features/profile/utils/facility-field-visibility.ts) that call
// createFieldVisibility() with their own field list.

export type ViewerRole = "owner" | "member" | "admin" | "guest";

export interface FieldVisibilityRule<T> {
  /** Which field on the entity this rule controls. */
  key: keyof T;
  /**
   * Returns whether this field should be visible to a viewer with the
   * given role. Keep these small and declarative — if a rule needs to
   * branch on anything beyond the entity + role, that's usually a sign
   * the underlying field needs its own named flag on the entity (the
   * way publicVisibility.showEmail/showPhone already work) rather than
   * logic buried in here.
   */
  visibleTo: (entity: T, role: ViewerRole) => boolean;
}

export interface FieldVisibility<T> {
  /**
   * Is this specific field visible to this viewer role?
   *
   * Fields with no registered rule are visible by default — the
   * registry is a list of *restrictions* on top of "visible to
   * everyone who can see the record at all," not a strict allowlist of
   * every field. That means adding a brand-new, non-sensitive field to
   * an entity never requires touching this file: it just shows up
   * automatically. Only fields that need hiding from some viewers need
   * an entry.
   *
   * This is a deliberate fail-open default, appropriate for
   * client-side UX polish on data that's already safe to fetch (RLS is
   * the real security boundary for anything that must never reach an
   * unauthorized client at all). If you want fail-closed semantics
   * instead — every field hidden unless explicitly allowed — flip the
   * `if (!rule) return true` below to `return false` and register every
   * field you want visible.
   */
  canSee(entity: T, role: ViewerRole, key: keyof T): boolean;
  /** Returns only the subset of the entity's fields the viewer may see. */
  pick(entity: T, role: ViewerRole): Partial<T>;
}

export function createFieldVisibility<T extends object>(
  rules: FieldVisibilityRule<T>[],
): FieldVisibility<T> {
  const ruleMap = new Map(rules.map((r) => [r.key, r]));

  return {
    canSee(entity, role, key) {
      const rule = ruleMap.get(key);
      if (!rule) return true;
      return rule.visibleTo(entity, role);
    },
    pick(entity, role) {
      const result: Partial<T> = {};
      for (const key of Object.keys(entity) as (keyof T)[]) {
        if (this.canSee(entity, role, key)) {
          result[key] = entity[key];
        }
      }
      return result;
    },
  };
}
