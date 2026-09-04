/**
 * fieldKeys.js — Dashboard-local copy of shared/constants/fieldKeys.ts
 *
 * WHY THIS EXISTS:
 * Vercel builds dashboard/citizen as a standalone project. Vite cannot
 * resolve `../../../../shared/...` imports that escape the build root.
 * This file is the canonical source of truth for the dashboard at build
 * time. Keep it in sync with shared/constants/fieldKeys.ts manually or
 * via a pre-build script.
 *
 * All sensitive identity fields are stored exclusively in profile_fields
 * as encrypted values. The profiles table NEVER holds plaintext PII.
 */

export const FIELD_KEYS = {
  FULL_NAME: "full_name",
  DOB: "dob",
  AADHAAR_NUMBER: "aadhaar_number",
  MOBILE: "mobile",
  ADDRESS: "address",
  ANNUAL_INCOME: "annual_income",
  COLLEGE_NAME: "college_name",
  MARKS_PERCENTAGE: "marks_percentage",
};

/** @type {Record<string, string>} */
export const FIELD_KEY_LABELS = {
  full_name: "Full name",
  dob: "Date of birth",
  aadhaar_number: "Aadhaar number",
  mobile: "Mobile number",
  address: "Address",
  annual_income: "Annual income",
  college_name: "College name",
  marks_percentage: "Marks percentage",
};

/** @type {Record<string, string[]>} */
export const FIELD_KEY_SYNONYMS = {
  full_name: ["name", "applicant name", "student name", "beneficiary name"],
  dob: ["date of birth", "birth date", "d.o.b"],
  aadhaar_number: ["aadhaar", "aadhaar no", "uid", "uidai number"],
  mobile: ["phone", "mobile number", "contact number", "telephone"],
  address: ["residential address", "permanent address", "postal address"],
  annual_income: ["income", "family income", "yearly income", "annual family income"],
  college_name: ["college", "institute name", "institution", "school name"],
  marks_percentage: ["percentage", "marks", "score", "academic percentage"],
};

export const FIELD_SENSITIVITY = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export const FIELD_SOURCE = {
  MANUAL: "manual",
  DIGILOCKER: "digilocker",
  API_SETU: "api_setu",
};

/** @type {Record<string, "high"|"medium"|"low">} */
export const FIELD_SENSITIVITY_MAP = {
  full_name: "low",
  college_name: "low",
  marks_percentage: "low",
  dob: "medium",
  mobile: "medium",
  address: "medium",
  annual_income: "medium",
  aadhaar_number: "high",
};

/**
 * @param {string} fieldKey
 * @returns {"high"|"medium"|"low"}
 */
export function getFieldSensitivity(fieldKey) {
  return FIELD_SENSITIVITY_MAP[fieldKey] ?? "medium";
}
