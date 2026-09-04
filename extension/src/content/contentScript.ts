import type { DetectableField, FieldKey, MessageResponse } from "../types";
import { renderConsentPanel } from "./consentPanel";
import { scanPageForFields } from "./scan";

const NOTICE_ID = "mahasetu-autofill-notice";

function showNotice(message: string) {
  let notice = document.getElementById(NOTICE_ID) as HTMLDivElement | null;

  if (!notice) {
    notice = document.createElement("div");
    notice.id = NOTICE_ID;
    notice.style.cssText = [
      "position:fixed",
      "bottom:18px",
      "right:18px",
      "z-index:2147483647",
      "background:#0f172a",
      "color:#fff",
      "padding:10px 14px",
      "border-radius:8px",
      "font-family:Arial,sans-serif",
      "font-size:14px",
      "box-shadow:0 8px 22px rgba(15,23,42,.2)",
    ].join(";");
    document.body.appendChild(notice);
  }

  notice.textContent = message;
}

function normalizeDateValue(rawValue: string): string {
  const trimmed = rawValue.trim();
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return trimmed;
}

function setNativeValue(element: HTMLElement, value: string) {
  const inputElement = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  const nextValue = "type" in inputElement && inputElement.type === "date" ? normalizeDateValue(value) : value;
  const valueSetter = Object.getOwnPropertyDescriptor(inputElement, "value")?.set;
  const prototype = Object.getPrototypeOf(inputElement);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(inputElement, nextValue);
  } else if (valueSetter) {
    valueSetter.call(inputElement, nextValue);
  } else {
    inputElement.value = nextValue;
  }

  inputElement.dispatchEvent(new Event("input", { bubbles: true }));
  inputElement.dispatchEvent(new Event("change", { bubbles: true }));
}

type MockDocumentResponse = {
  documents: Array<{ fields: Partial<Record<FieldKey, string>> }>;
};

async function fetchMockDigiLockerFields(): Promise<Partial<Record<FieldKey, string>>> {
  const response = await fetch(`${window.location.origin}/api/mock/digilocker/documents`);
  if (!response.ok) throw new Error("Mock DigiLocker API is unavailable.");

  const data = (await response.json()) as MockDocumentResponse;
  return data.documents.reduce<Partial<Record<FieldKey, string>>>((profile, document) => {
    Object.assign(profile, document.fields);
    return profile;
  }, {});
}

function fillApprovedFields(fields: DetectableField[], approvedKeys: FieldKey[], profile: Partial<Record<FieldKey, string>>) {
  const filled: Array<{ fieldKey: FieldKey; value: string }> = [];
  const allowed = new Set(approvedKeys);

  fields.forEach((field) => {
    if (!allowed.has(field.fieldKey)) return;

    const value = profile[field.fieldKey];
    const target = document.getElementById(field.elementId);
    if (!target || !value) return;

    setNativeValue(target, value);
    filled.push({ fieldKey: field.fieldKey, value });
  });

  return filled;
}

function requestConsentAndAutofill(fields: DetectableField[], sendResponse: (response: MessageResponse) => void) {
  const siteOrigin = window.location.origin;

  renderConsentPanel(fields, siteOrigin, async (approvedKeys, purpose) => {
    chrome.runtime.sendMessage(
      {
        type: "GRANT_CONSENT",
        payload: { siteOrigin, purpose, fieldKeys: approvedKeys, expiresAt: null },
      },
      () => {
        // Best-effort: swallow "Receiving end does not exist" if the service
        // worker is sleeping when consent fires. The consent record is stored
        // by the service worker when it wakes; this is non-critical for autofill.
        void chrome.runtime.lastError;
      },
    );

    try {
      const profile = await fetchMockDigiLockerFields();
      const filled = fillApprovedFields(fields, approvedKeys, profile);
      showNotice(`MahaSetu filled ${filled.length} field${filled.length === 1 ? "" : "s"} from mock DigiLocker.`);

      sendResponse({
        success: true,
        fields,
        filled,
        message: `MahaSetu filled ${filled.length} field${filled.length === 1 ? "" : "s"} from mock DigiLocker after consent.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to fetch mock DigiLocker data.";
      showNotice(message);
      sendResponse({ success: false, fields, message });
    }
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SCAN_PAGE") {
    const fields = scanPageForFields();
    sendResponse({ success: true, fields });
    return true;
  }

  if (message?.type === "AUTOFILL_FORM") {
    const fields = scanPageForFields();
    if (fields.length === 0) {
      sendResponse({ success: false, fields, message: "No MahaSetu-compatible fields found on this page." });
      return true;
    }

    requestConsentAndAutofill(fields, sendResponse);
    return true;
  }

  return false;
});

console.log("MahaSetu content script loaded.");
