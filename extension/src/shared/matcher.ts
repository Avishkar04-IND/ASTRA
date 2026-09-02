import type { DetectableField, FieldKey } from "../types";

const FIELD_SYNONYMS: Record<FieldKey, string[]> = {
  full_name: ["full name", "name", "applicant name", "student name", "beneficiary name", "candidate name"],
  dob: ["date of birth", "dob", "birth date", "d o b"],
  aadhaar_number: ["aadhaar number", "aadhaar no", "aadhar number", "aadhar no", "uidai number", "uid", "aadhaar", "aadhar"],
  mobile: ["mobile", "mobile number", "phone", "phone number", "contact number", "telephone"],
  address: ["address", "residential address", "permanent address", "current address", "postal address"],
  annual_income: ["annual income", "income", "family income", "household income", "annual family income"],
  college_name: ["college", "college name", "institution name", "institute name", "school name", "university name"],
  marks_percentage: ["marks", "percentage", "marks percentage", "score", "academic percentage", "class 10 marks"],
};

export const normalize = (value: string): string =>
  value.toLowerCase().trim().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ");

const containsPhrase = (value: string, phrase: string): boolean => {
  const escapedPhrase = normalize(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escapedPhrase}(\\s|$)`).test(value);
};

const isUnsupportedIdentityField = (normalizedValue: string): boolean =>
  containsPhrase(normalizedValue, "email") ||
  containsPhrase(normalizedValue, "e mail") ||
  containsPhrase(normalizedValue, "pan") ||
  containsPhrase(normalizedValue, "pan number") ||
  containsPhrase(normalizedValue, "permanent account number");

const scoreField = (normalizedLabel: string, normalizedCombined: string, fieldKey: FieldKey): number => {
  let score = 0;

  for (const synonym of FIELD_SYNONYMS[fieldKey]) {
    const normalizedSynonym = normalize(synonym);

    if (normalizedLabel === normalizedSynonym) {
      score = Math.max(score, 100);
      continue;
    }

    if (containsPhrase(normalizedLabel, normalizedSynonym)) {
      score = Math.max(score, normalizedSynonym.includes(" ") ? 90 : 55);
      continue;
    }

    if (containsPhrase(normalizedCombined, normalizedSynonym)) {
      score = Math.max(score, normalizedSynonym.includes(" ") ? 70 : 35);
    }
  }

  return score;
};

export function matchFieldKey(label: string, fallback?: string): FieldKey | undefined {
  const normalizedLabel = normalize(label);
  const combined = [label, fallback || ""].filter(Boolean).map(normalize).join(" ");

  if (isUnsupportedIdentityField(normalizedLabel)) {
    return undefined;
  }

  if (normalizedLabel === "name") {
    return "full_name";
  }

  if (containsPhrase(combined, "course name")) {
    return undefined;
  }

  if (containsPhrase(normalizedLabel, "full name")) {
    return "full_name";
  }

  let bestMatch: { fieldKey: FieldKey; score: number } | undefined;

  for (const fieldKey of Object.keys(FIELD_SYNONYMS) as FieldKey[]) {
    const score = scoreField(normalizedLabel, combined, fieldKey);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { fieldKey, score };
    }
  }

  if (bestMatch && bestMatch.score >= 55) {
    return bestMatch.fieldKey;
  }

  return undefined;
}

export function buildConfidence(fieldKey?: FieldKey): number {
  return fieldKey ? 0.95 : 0.2;
}

export function checkFormatMismatch(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  fieldKey?: FieldKey,
): string | undefined {
  if (!fieldKey) return undefined;

  const maxLengthAttr = element.getAttribute("maxlength");
  const maxLength = maxLengthAttr ? Number.parseInt(maxLengthAttr, 10) : undefined;
  const expectedMaxLength: Partial<Record<FieldKey, number>> = {
    aadhaar_number: 12,
    mobile: 10,
  };

  const expected = expectedMaxLength[fieldKey];
  if (expected && maxLength && maxLength < expected) {
    return `Field length constraint is too short for ${fieldKey}; expected ${expected} characters.`;
  }

  return undefined;
}

export function isHighConfidence(field: DetectableField): boolean {
  return field.confidence >= 0.7 && !field.mismatchWarning;
}
