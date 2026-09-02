import type { DetectableField, FieldKey } from "../types";

type ConsentSubmit = (approvedKeys: FieldKey[], purpose: string) => void;

export function renderConsentPanel(matchedFields: DetectableField[], siteOrigin: string, onSubmit: ConsentSubmit) {
  document.getElementById("mahasetu-consent-host")?.remove();

  const host = document.createElement("div");
  host.id = "mahasetu-consent-host";
  host.style.cssText = "position:fixed;top:20px;right:20px;z-index:2147483647;";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; font-family: Arial, sans-serif; }
    .panel { width: 340px; background: #fff; border: 1px solid #dbe4ea; border-radius: 8px; box-shadow: 0 12px 30px rgba(15,23,42,.18); overflow: hidden; }
    .header { background: #1447e6; color: #fff; padding: 14px 16px; font-weight: 700; font-size: 15px; }
    .content { padding: 14px 16px; }
    .intro { font-size: 13px; color: #475569; margin: 0 0 14px; line-height: 1.4; }
    .field-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
    .field-item { display: flex; gap: 10px; align-items: flex-start; padding: 9px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
    .field-item.warning { border-color: #f59e0b; background: #fffbeb; }
    .field-label { color: #0f172a; font-size: 13px; font-weight: 700; }
    .meta { color: #64748b; font-size: 12px; margin-top: 3px; }
    .warning-text { color: #b45309; font-size: 12px; margin-top: 5px; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-group label { color: #334155; font-size: 13px; font-weight: 700; }
    .input-group input { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; font-size: 13px; }
    .actions { display: flex; gap: 10px; padding: 14px 16px; border-top: 1px solid #e2e8f0; background: #f8fafc; }
    button { flex: 1; border: 0; border-radius: 6px; padding: 9px 10px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .cancel { background: #fff; border: 1px solid #cbd5e1; color: #475569; }
    .approve { background: #166534; color: #fff; }
    input[type="checkbox"] { width: 16px; height: 16px; accent-color: #166534; }
  `;
  shadow.appendChild(style);

  const panel = document.createElement("div");
  panel.className = "panel";

  const formatKey = (key: string) => key.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const fieldsHTML = matchedFields
    .map((field) => {
      const warningClass = field.mismatchWarning ? " warning" : "";
      const checked = field.mismatchWarning ? "" : "checked";
      const label = field.label || formatKey(field.fieldKey);
      return `
        <label class="field-item${warningClass}">
          <input type="checkbox" value="${field.fieldKey}" ${checked} aria-label="Consent to fill ${label}">
          <span>
            <span class="field-label">${label}</span>
            <span class="meta">${formatKey(field.fieldKey)} - ${Math.round(field.confidence * 100)}% match</span>
            ${field.mismatchWarning ? `<span class="warning-text">${field.mismatchWarning}</span>` : ""}
          </span>
        </label>
      `;
    })
    .join("");

  panel.innerHTML = `
    <div class="header">MahaSetu - Review before sharing</div>
    <div class="content">
      <p class="intro">MahaSetu detected fields on this portal. Choose what to fill for this prototype demo.</p>
      <div class="field-list">${fieldsHTML}</div>
      <div class="input-group">
        <label for="purpose-input">Purpose of sharing</label>
        <input id="purpose-input" value="Form autofill on ${siteOrigin}" />
      </div>
    </div>
    <div class="actions">
      <button class="cancel" id="cancel-button">Cancel</button>
      <button class="approve" id="approve-button">Approve Selected</button>
    </div>
  `;
  shadow.appendChild(panel);

  const cleanup = () => host.remove();
  shadow.getElementById("cancel-button")?.addEventListener("click", cleanup);
  shadow.getElementById("approve-button")?.addEventListener("click", () => {
    const approvedKeys = Array.from(shadow.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')).map(
      (checkbox) => checkbox.value as FieldKey,
    );
    const purposeInput = shadow.getElementById("purpose-input") as HTMLInputElement | null;
    onSubmit(approvedKeys, purposeInput?.value.trim() || `Form autofill on ${siteOrigin}`);
    cleanup();
  });
}
