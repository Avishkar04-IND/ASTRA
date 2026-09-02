import { FIELD_KEYS, type FieldKey } from "../constants/fieldKeys";

export interface FieldSchema {
  key: FieldKey;
  label: string;
  type: "text" | "date" | "number";
  sensitivity: "normal" | "sensitive" | "restricted";
  mockOnly?: boolean;
  pattern?: RegExp;
}

export const FIELD_SCHEMAS: Record<FieldKey, FieldSchema> = {
  [FIELD_KEYS.FULL_NAME]: {
    key: FIELD_KEYS.FULL_NAME,
    label: "Full name",
    type: "text",
    sensitivity: "normal",
  },
  [FIELD_KEYS.DOB]: {
    key: FIELD_KEYS.DOB,
    label: "Date of birth",
    type: "date",
    sensitivity: "sensitive",
  },
  [FIELD_KEYS.AADHAAR_NUMBER]: {
    key: FIELD_KEYS.AADHAAR_NUMBER,
    label: "Aadhaar number",
    type: "text",
    sensitivity: "restricted",
    mockOnly: true,
    pattern: /^\d{12}$/,
  },
  [FIELD_KEYS.MOBILE]: {
    key: FIELD_KEYS.MOBILE,
    label: "Mobile number",
    type: "text",
    sensitivity: "sensitive",
    pattern: /^[6-9]\d{9}$/,
  },
  [FIELD_KEYS.ADDRESS]: {
    key: FIELD_KEYS.ADDRESS,
    label: "Address",
    type: "text",
    sensitivity: "sensitive",
  },
  [FIELD_KEYS.ANNUAL_INCOME]: {
    key: FIELD_KEYS.ANNUAL_INCOME,
    label: "Annual income",
    type: "number",
    sensitivity: "sensitive",
  },
  [FIELD_KEYS.COLLEGE_NAME]: {
    key: FIELD_KEYS.COLLEGE_NAME,
    label: "College name",
    type: "text",
    sensitivity: "normal",
  },
  [FIELD_KEYS.MARKS_PERCENTAGE]: {
    key: FIELD_KEYS.MARKS_PERCENTAGE,
    label: "Marks percentage",
    type: "number",
    sensitivity: "normal",
  },
};
