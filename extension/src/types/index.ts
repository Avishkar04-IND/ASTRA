export type FieldKey =
  | "full_name"
  | "dob"
  | "aadhaar_number"
  | "mobile"
  | "address"
  | "annual_income"
  | "college_name"
  | "marks_percentage";

export type DetectableField = {
  fieldKey: FieldKey;
  label: string;
  elementId: string;
  confidence: number;
  elementType: "input" | "textarea" | "select";
  placeholder?: string;
  name?: string;
  ariaLabel?: string;
  mismatchWarning?: string;
};

export type ScanPageMessage = {
  type: "SCAN_PAGE";
};

export type AutofillPageMessage = {
  type: "AUTOFILL_FORM";
};

export type GrantConsentMessage = {
  type: "GRANT_CONSENT";
  payload: {
    siteOrigin: string;
    purpose: string;
    fieldKeys: FieldKey[];
    expiresAt?: string | null;
  };
};

export type RequestAutofillMessage = {
  type: "REQUEST_AUTOFILL";
  payload: {
    siteOrigin: string;
    requestedFieldKeys: FieldKey[];
  };
};

export type FormDetectedMessage = {
  type: "FORM_DETECTED";
  payload: {
    siteOrigin: string;
    matchedFieldKeys: FieldKey[];
  };
};

export type ExtensionMessage =
  | ScanPageMessage
  | AutofillPageMessage
  | GrantConsentMessage
  | RequestAutofillMessage
  | FormDetectedMessage;

export type MessageResponse = {
  success: boolean;
  fields?: DetectableField[];
  filled?: Array<{ fieldKey: FieldKey; value: string }>;
  missingConsents?: FieldKey[];
  message?: string;
  error?: string;
};
