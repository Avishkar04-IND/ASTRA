import type { FieldKey } from "../constants/fieldKeys";

export type UUID = string;
export type ISODateString = string;
export type ISODateTimeString = string;

export type UserRole = "citizen" | "official" | "admin";
export type ConsentStatus = "active" | "revoked" | "expired";
export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "requires_action";
export type GrievanceStatus = "open" | "in_review" | "resolved" | "closed";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "escalated";
export type DocumentSource = "manual" | "digilocker" | "api_setu";
export type FieldSensitivity = "high" | "medium" | "low";

export interface UserProfile {
  id: UUID;
  email: string;
  key_derivation_salt: string;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface Document {
  id: UUID;
  user_id: UUID;
  type: string;
  display_name: string;
  source: DocumentSource;
  storage_path?: string;
  issued_by?: string;
  issued_at?: ISODateString;
  metadata?: Record<string, unknown>;
  created_at: ISODateTimeString;
}

export interface Consent {
  id: UUID;
  user_id: UUID;
  purpose: string;
  requester: string;
  site_origin?: string;
  field_keys: FieldKey[];
  document_ids?: UUID[];
  status: ConsentStatus;
  expires_at?: ISODateTimeString;
  revoked_at?: ISODateTimeString;
  created_at: ISODateTimeString;
}

export interface Department {
  id: UUID;
  name: string;
  code: string;
  contact_email?: string;
}

export interface Service {
  id: UUID;
  department_id: UUID;
  name: string;
  code: string;
  required_field_keys: FieldKey[];
  required_document_types: string[];
}

export interface Application {
  id: UUID;
  user_id: UUID;
  service_id: UUID;
  department_id: UUID;
  status: ApplicationStatus;
  submitted_at?: ISODateTimeString;
  current_step?: string;
  external_reference?: string;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface ApplicationEvent {
  id: UUID;
  application_id: UUID;
  type: string;
  title: string;
  description?: string;
  actor_id?: UUID;
  occurred_at: ISODateTimeString;
  metadata?: Record<string, unknown>;
}

export type TimelineEvent = ApplicationEvent;

export interface Grievance {
  id: UUID;
  user_id: UUID;
  application_id?: UUID;
  department_id?: UUID;
  subject: string;
  description: string;
  status: GrievanceStatus;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface Approval {
  id: UUID;
  application_id: UUID;
  approver_id: UUID;
  status: ApprovalStatus;
  remarks?: string;
  decided_at?: ISODateTimeString;
  created_at: ISODateTimeString;
}

export interface AuditLog {
  id: UUID;
  actor_id?: UUID;
  user_id?: UUID;
  action: string;
  resource_type: string;
  resource_id?: UUID;
  field_key?: FieldKey;
  site_origin?: string;
  details?: Record<string, unknown>;
  created_at: ISODateTimeString;
}

export interface FieldMapping {
  id: UUID;
  service_id?: UUID;
  site_origin: string;
  form_field_name: string;
  form_field_label?: string;
  field_key: FieldKey;
  confidence: number;
  strategy: "normalization" | "synonym" | "fuzzy" | "format_validation" | "llm_fallback";
  created_at: ISODateTimeString;
}
