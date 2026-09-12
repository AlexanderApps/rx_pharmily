export type PhoneVerificationEntityType = "user" | "facility" | "organization";

export interface StartRequestBody {
  action: "start";
  entityType: PhoneVerificationEntityType;
  entityId: string;
}

export interface CheckRequestBody {
  action: "check";
  entityType: PhoneVerificationEntityType;
  entityId: string;
  code: string;
}

export type RequestBody = StartRequestBody | CheckRequestBody;

export interface OtpCodeRow {
  id: string;
  entity_type: PhoneVerificationEntityType;
  entity_id: string;
  phone: string;
  code_hash: string;
  attempts: number;
  max_attempts: number;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
}
