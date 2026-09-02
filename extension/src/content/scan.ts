import type { DetectableField, FieldKey } from "../types";
import { buildConfidence, checkFormatMismatch, matchFieldKey } from "../shared/matcher";

const FIELD_KEYS: FieldKey[] = [
  "full_name",
  "dob",
  "aadhaar_number",
  "mobile",
  "address",
  "annual_income",
  "college_name",
  "marks_percentage",
];

const getExplicitFieldKey = (element: HTMLElement): FieldKey | undefined => {
  const fieldKey = element.dataset.mahasetuField || element.dataset.govassistField;
  return FIELD_KEYS.includes(fieldKey as FieldKey) ? (fieldKey as FieldKey) : undefined;
};

const getLabelText = (element: HTMLElement): string => {
  const labels = (element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).labels as
    | NodeListOf<HTMLLabelElement>
    | undefined;

  if (labels && labels.length > 0) {
    return Array.from(labels)
      .map((label) => label.textContent || "")
      .join(" ");
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  const nearest = element.closest("label");
  if (nearest) return nearest.textContent || "";

  return "";
};

const isEligibleElement = (
  element: Element,
): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement => {
  const tag = element.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
};

export function scanPageForFields(): DetectableField[] {
  const fields: DetectableField[] = [];

  document.querySelectorAll("input, textarea, select").forEach((element) => {
    if (!isEligibleElement(element)) return;

    const type = element.type?.toLowerCase();
    if (type === "hidden" || type === "file" || type === "submit" || type === "button") {
      return;
    }

    const label = getLabelText(element);
    const fallback = [element.name, element.id, element.getAttribute("placeholder") || ""].filter(Boolean).join(" ");
    const fieldKey = getExplicitFieldKey(element) || matchFieldKey(label, fallback);

    if (!fieldKey) return;

    if (!label && !element.name && !element.id && !element.getAttribute("placeholder")) {
      return;
    }

    const elementId = element.id || `mahasetu-${crypto.randomUUID()}`;
    if (!element.id) element.id = elementId;

    fields.push({
      fieldKey,
      label: label || element.getAttribute("aria-label") || element.name || element.id || fieldKey,
      elementId,
      confidence: buildConfidence(fieldKey),
      elementType: element.tagName.toLowerCase() as "input" | "textarea" | "select",
      placeholder: element.getAttribute("placeholder") || undefined,
      name: element.name || undefined,
      ariaLabel: element.getAttribute("aria-label") || undefined,
      mismatchWarning: checkFormatMismatch(element, fieldKey),
    });
  });

  return fields;
}
