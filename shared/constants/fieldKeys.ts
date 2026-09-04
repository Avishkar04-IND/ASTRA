// All sensitive identity fields are stored exclusively in profile_fields as encrypted values. profiles never holds plaintext PII.
export const FIELD_KEYS = {
  FULL_NAME: "full_name",
  DOB: "dob",
  AADHAAR_NUMBER: "aadhaar_number",
  MOBILE: "mobile",
  ADDRESS: "address",
  ANNUAL_INCOME: "annual_income",
  COLLEGE_NAME: "college_name",
  MARKS_PERCENTAGE: "marks_percentage",
} as const;

export type FieldKey = (typeof FIELD_KEYS)[keyof typeof FIELD_KEYS];

export const FIELD_KEY_LABELS: Record<FieldKey, string> = {
  full_name: "Full name",
  dob: "Date of birth",
  aadhaar_number: "Aadhaar number",
  mobile: "Mobile number",
  address: "Address",
  annual_income: "Annual income",
  college_name: "College name",
  marks_percentage: "Marks percentage",
};

export const FIELD_KEY_SYNONYMS: Record<FieldKey, string[]> = {
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
} as const;

export const FIELD_SOURCE = {
  MANUAL: "manual",
  DIGILOCKER: "digilocker",
  API_SETU: "api_setu",
} as const;

export const FIELD_SENSITIVITY_MAP: Record<FieldKey, "high" | "medium" | "low"> = {
  full_name: "low",
  college_name: "low",
  marks_percentage: "low",
  dob: "medium",
  mobile: "medium",
  address: "medium",
  annual_income: "medium",
  aadhaar_number: "high",
};

export function getFieldSensitivity(fieldKey: FieldKey): "high" | "medium" | "low" {
  return FIELD_SENSITIVITY_MAP[fieldKey] ?? "medium";
}
