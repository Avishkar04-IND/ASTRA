/**
 * fieldSchemas.js — Dashboard-local copy of shared/schemas/fieldSchemas.ts
 *
 * WHY THIS EXISTS:
 * Vercel builds dashboard/citizen as a standalone project. Vite cannot
 * resolve `../../../../shared/...` imports that escape the build root.
 * This file is the canonical source of truth for the dashboard at build
 * time. Keep it in sync with shared/schemas/fieldSchemas.ts manually or
 * via a pre-build script.
 */

import { z } from "zod";
import { FIELD_KEYS, FIELD_SENSITIVITY_MAP } from "./fieldKeys.js";

/**
 * @typedef {{ key: string, label: string, type: "text"|"date"|"number", sensitivity: "high"|"medium"|"low", mockOnly?: boolean, pattern?: RegExp }} FieldSchema
 */

/** @type {Record<string, FieldSchema>} */
export const FIELD_SCHEMAS = {
  [FIELD_KEYS.FULL_NAME]: {
    key: FIELD_KEYS.FULL_NAME,
    label: "Full name",
    type: "text",
    sensitivity: FIELD_SENSITIVITY_MAP[FIELD_KEYS.FULL_NAME],
  },
  [FIELD_KEYS.DOB]: {
    key: FIELD_KEYS.DOB,
    label: "Date of birth",
    type: "date",
    sensitivity: FIELD_SENSITIVITY_MAP[FIELD_KEYS.DOB],
  },
  [FIELD_KEYS.AADHAAR_NUMBER]: {
    key: FIELD_KEYS.AADHAAR_NUMBER,
    label: "Aadhaar number",
    type: "text",
    sensitivity: FIELD_SENSITIVITY_MAP[FIELD_KEYS.AADHAAR_NUMBER],
    mockOnly: true,
    pattern: /^\d{12}$/,
  },
  [FIELD_KEYS.MOBILE]: {
    key: FIELD_KEYS.MOBILE,
    label: "Mobile number",
    type: "text",
    sensitivity: FIELD_SENSITIVITY_MAP[FIELD_KEYS.MOBILE],
    pattern: /^[6-9]\d{9}$/,
  },
  [FIELD_KEYS.ADDRESS]: {
    key: FIELD_KEYS.ADDRESS,
    label: "Address",
    type: "text",
    sensitivity: FIELD_SENSITIVITY_MAP[FIELD_KEYS.ADDRESS],
  },
  [FIELD_KEYS.ANNUAL_INCOME]: {
    key: FIELD_KEYS.ANNUAL_INCOME,
    label: "Annual income",
    type: "number",
    sensitivity: FIELD_SENSITIVITY_MAP[FIELD_KEYS.ANNUAL_INCOME],
  },
  [FIELD_KEYS.COLLEGE_NAME]: {
    key: FIELD_KEYS.COLLEGE_NAME,
    label: "College name",
    type: "text",
    sensitivity: FIELD_SENSITIVITY_MAP[FIELD_KEYS.COLLEGE_NAME],
  },
  [FIELD_KEYS.MARKS_PERCENTAGE]: {
    key: FIELD_KEYS.MARKS_PERCENTAGE,
    label: "Marks percentage",
    type: "number",
    sensitivity: FIELD_SENSITIVITY_MAP[FIELD_KEYS.MARKS_PERCENTAGE],
  },
};

export const UserProfileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").optional().or(z.literal("")),
  dob: z.string().optional().or(z.literal("")),
  aadhaar_number: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits").optional().or(z.literal("")),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});
