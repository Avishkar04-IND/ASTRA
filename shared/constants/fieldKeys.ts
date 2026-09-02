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
