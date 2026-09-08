export interface NotificationRow {
  id: string;
  user_id: string;
  category: string;
  title: string;
  body: string;
  link_pathname: string | null;
  link_params: Record<string, string> | null;
  read: boolean;
  created_at: string;
}

export interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: NotificationRow | null;
  old_record: NotificationRow | null;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  platform: "ios" | "android" | "web";
  expo_push_token: string | null;
  web_endpoint: string | null;
  web_p256dh: string | null;
  web_auth: string | null;
}
