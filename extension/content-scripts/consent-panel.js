/**
 * MahaSetu — Consent Panel UI
 * Injects a Shadow DOM panel to review fields before autofill.
 */

export function renderConsentPanel(matchedFields, siteOrigin, onSubmit) {
  // Create host element for Shadow DOM
  const host = document.createElement('div');
  host.id = 'mahasetu-consent-host';
  // High z-index to stay on top
  host.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2147483647;
  `;
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .panel {
      width: 340px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .header {
      background: #4f46e5;
      color: white;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      font-size: 15px;
    }
    .header svg { width: 18px; height: 18px; fill: currentColor; }
    .content { padding: 16px; }
    .intro { font-size: 13px; color: #475569; margin: 0 0 16px 0; line-height: 1.4; }
    .field-list { margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
    .field-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .field-item.warning { border-color: #f59e0b; background: #fffbeb; }
    .checkbox-wrap { margin-top: 2px; }
    .field-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .field-label { font-size: 14px; font-weight: 500; color: #1e293b; display: flex; align-items: center; gap: 6px; }
    .confidence { font-size: 11px; color: #64748b; background: #e2e8f0; padding: 2px 6px; border-radius: 10px; }
    .warning-text { font-size: 12px; color: #d97706; margin: 0; }
    .input-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .input-group label { font-size: 13px; font-weight: 500; color: #334155; }
    .input-group input { 
      padding: 8px 12px; 
      border: 1px solid #cbd5e1; 
      border-radius: 6px; 
      font-size: 13px;
      outline: none;
    }
    .input-group input:focus { border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2); }
    .actions { display: flex; gap: 10px; padding: 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .btn {
      flex: 1;
      padding: 10px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s;
      border: none;
    }
    .btn-cancel { background: white; color: #475569; border: 1px solid #cbd5e1; }
    .btn-cancel:hover { background: #f1f5f9; }
    .btn-approve { background: #4f46e5; color: white; }
    .btn-approve:hover { background: #4338ca; }
    input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: #4f46e5; }
  `;
  shadow.appendChild(style);

  // Build panel UI
  const panel = document.createElement('div');
  panel.className = 'panel';

  const formatKey = (key) => key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const fieldsHTML = matchedFields.map(f => {
    const isWarning = !!f.mismatchWarning;
    const checked = !isWarning ? 'checked' : '';
    const confPct = Math.round(f.confidence * 100) + '%';
    const labelText = f.label || formatKey(f.fieldKey);
    
    return `
      <label class="field-item ${isWarning ? 'warning' : ''}">
        <div class="checkbox-wrap">
          <input type="checkbox" value="${f.fieldKey}" ${checked} aria-label="Consent to fill ${labelText}">
        </div>
        <div class="field-info">
          <div class="field-label">
            ${labelText} 
            <span class="confidence" title="Detection confidence">${confPct}</span>
            ${isWarning ? `<span title="${f.mismatchWarning}">⚠️</span>` : ''}
          </div>
          ${isWarning ? `<p class="warning-text">${f.mismatchWarning}</p>` : ''}
        </div>
      </label>
    `;
  }).join('');

  panel.innerHTML = `
    <div class="header">
      <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
      MahaSetu — Review before sharing
    </div>
    <div class="content">
      <p class="intro">MahaSetu detected government fields on this page. Select which fields you want to autofill.</p>
      
      <div class="field-list">
        ${fieldsHTML}
      </div>

      <div class="input-group">
        <label for="purpose-input">Purpose of sharing</label>
        <input type="text" id="purpose-input" value="Form autofill on ${siteOrigin}" aria-label="Purpose of sharing">
      </div>
    </div>
    <div class="actions">
      <button class="btn btn-cancel" id="btn-cancel">Cancel</button>
      <button class="btn btn-approve" id="btn-approve">Approve Selected</button>
    </div>
  `;

  shadow.appendChild(panel);

  // Event Listeners
  const cancelBtn = shadow.getElementById('btn-cancel');
  const approveBtn = shadow.getElementById('btn-approve');
  const purposeInput = shadow.getElementById('purpose-input');

  const cleanup = () => host.remove();

  cancelBtn.addEventListener('click', cleanup);

  approveBtn.addEventListener('click', () => {
    const checkboxes = shadow.querySelectorAll('input[type="checkbox"]:checked');
    const approvedKeys = Array.from(checkboxes).map(cb => cb.value);
    const purpose = purposeInput.value.trim() || `Form autofill on ${siteOrigin}`;
    
    onSubmit(approvedKeys, purpose);
    cleanup();
  });
}
