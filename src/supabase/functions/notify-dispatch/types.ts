// Shared types for the notify-dispatch Edge Function.
//
// This mirrors the payload shape Supabase's Database Webhooks send on
// every configured INSERT/UPDATE/DELETE — see:
// https://supabase.com/docs/guides/database/webhooks

export interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, any> | null;
  old_record: Record<string, any> | null;
}

// Matches features/notifications/types/notifications.types.ts's
// NotificationCategory union on the client — kept as a plain string
// here (not re-exporting the client type) since this function has no
// dependency on the Expo app's source tree at all; it only needs to
// write a value the notifications table's check accepts.
export type NotificationCategory = string;

export interface NotificationLink {
  pathname: string;
  params?: Record<string, string>;
}
