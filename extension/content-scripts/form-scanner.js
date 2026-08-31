/**
 * MahaSetu — Form Scanner Content Script
 */

import { renderConsentPanel } from './consent-panel.js';

(() => {
  'use strict';

  // Map to safely associate a unique string ID with the actual DOM element.
  // We use WeakRef to prevent memory leaks if the DOM element is removed from the page.
  const elementRegistry = new Map();
  let fieldCounter = 0;

  // Layer 1: Canonical keys to synonym arrays mapping
  const FIELD_DICTIONARY = {
    'aadhaar_number': ["aadhaar", "aadhar", "aadhaar no", "uid number", "aadhaar card number"],
    'pan_number': ["pan", "pan number", "permanent account number", "pan card"],
    'full_name': ["full name", "name", "applicant name", "candidate name"],
    'date_of_birth': ["dob", "date of birth", "birth date"],
    'address': ["address", "residential address", "permanent address"],
    'phone_number': ["mobile", "phone", "contact number", "mobile number"],
    'email': ["email", "email address", "e-mail"],
    'marksheet_10th_percentage': ["10th percentage", "ssc percentage", "class 10 marks"]
  };

  /**
   * Normalizes a string by converting to lowercase and stripping 
   * all punctuation and extraneous whitespace.
   */
  function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Attempts to find the label text for a given input element.
   * Checks explicit <label for="id"> and implicit <label><input></label>.
   */
  function getLabelText(el) {
    let labelText = '';
    
    // Explicit label via 'id'
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) {
        labelText += ' ' + label.innerText;
      }
    }
    
    // Implicit label (element is inside a label)
    const parentLabel = el.closest('label');
    if (parentLabel) {
      // Clone label to extract text without the input's own text content
      const clone = parentLabel.cloneNode(true);
      const inputs = clone.querySelectorAll('input, select, textarea');
      inputs.forEach(i => i.remove());
      labelText += ' ' + clone.innerText;
    }
    
    return labelText;
  }

  /**
   * Layer 1 - Label/attribute matching
   * Compares extracted text against the synonym dictionary.
   */
  function matchFieldKey(normalizedSignals) {
    let bestMatch = null;
    let highestConfidence = 0;

    for (const [canonicalKey, synonyms] of Object.entries(FIELD_DICTIONARY)) {
      for (const syn of synonyms) {
        const normSyn = normalizeText(syn);
        
        // Simple substring/fuzzy match
        if (normalizedSignals.includes(normSyn)) {
          // Exact word match gets higher confidence
          const signalsArray = normalizedSignals.split(' ');
          if (signalsArray.includes(normSyn) || normalizedSignals === normSyn) {
             highestConfidence = Math.max(highestConfidence, 0.95);
             bestMatch = canonicalKey;
          } else {
             highestConfidence = Math.max(highestConfidence, 0.80);
             bestMatch = canonicalKey;
          }
        }
      }
    }

    // Layer 3 (positional/DOM-context heuristics) is explicitly OUT OF SCOPE for this pass. (Stretch goal)
    // Layer 4 (LLM fallback for unmatched fields) is explicitly OUT OF SCOPE for this pass. (Stretch goal)

    return { fieldKey: bestMatch, confidence: highestConfidence };
  }

  /**
   * Layer 2 - Format validation
   * Checks DOM constraints against expected formats to detect mismatches.
   * If a field imposes constraints incompatible with our stored format, flag it.
   */
  function checkFormatMismatch(el, fieldKey) {
    if (!fieldKey) return null;
    
    const maxLengthAttr = el.getAttribute('maxlength');
    const maxLength = maxLengthAttr ? parseInt(maxLengthAttr, 10) : null;
    
    let expectedMaxLength = null;

    switch (fieldKey) {
      case 'aadhaar_number':
        expectedMaxLength = 12;
        break;
      case 'pan_number':
        expectedMaxLength = 10;
        break;
      case 'phone_number':
        expectedMaxLength = 10; // commonly 10 for India
        break;
    }

    // If the DOM field imposes a shorter max length than the expected data,
    // it's a mismatch (data would be truncated, so we shouldn't autofill it silently).
    if (expectedMaxLength !== null && maxLength !== null && !isNaN(maxLength) && maxLength < expectedMaxLength) {
      return `Field length constraint (maxlength="${maxLength}") is too short for ${fieldKey} (expected ${expectedMaxLength}).`;
    }

    // Add additional regex pattern mismatches and type validation here as needed.
    return null;
  }

  /**
   * Scans the DOM and extracts matching identity fields.
   * Returns: [{ domElement, fieldKey, confidence, mismatchWarning, _tempId }]
   */
  function scanForm() {
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea'));
    const matchedFields = [];

    inputs.forEach((input) => {
      // 1. Extract identifying signals
      const labelText = getLabelText(input);
      const placeholder = input.getAttribute('placeholder') || '';
      const name = input.getAttribute('name') || '';
      const id = input.getAttribute('id') || '';
      const ariaLabel = input.getAttribute('aria-label') || '';

      const rawSignals = `${labelText} ${placeholder} ${name} ${id} ${ariaLabel}`;
      const normalizedSignals = normalizeText(rawSignals);

      // 2. Layer 1 matching
      const { fieldKey, confidence } = matchFieldKey(normalizedSignals);

      if (fieldKey && confidence > 0.5) {
        // 3. Layer 2 format validation
        const mismatchWarning = checkFormatMismatch(input, fieldKey);
        
        fieldCounter++;
        const tempId = `mahasetu_field_${fieldCounter}`;
        // Store the actual DOM element locally wrapped in a WeakRef so it can be garbage collected
        elementRegistry.set(tempId, new WeakRef(input));
        
        matchedFields.push({
          domElement: input, // We don't serialize this in messaging, but keep it in the local array for immediate logic if needed
          fieldKey,
          label: labelText.trim() || placeholder || name || fieldKey,
          confidence,
          mismatchWarning,
          _tempId: tempId
        });
      }
    });

    return matchedFields;
  }

  /**
   * Safely sets the value of a DOM element and triggers React-compatible events
   */
  function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    
    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }
    
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Injects the consent preview UI and handles autofill upon approval
   */
  function showConsentPreview(matchedFields) {
    const siteOrigin = window.location.origin;
    
    renderConsentPanel(matchedFields, siteOrigin, async (approvedKeys, purpose) => {
      try {
        // 1. Send GRANT_CONSENT message
        await chrome.runtime.sendMessage({
          type: 'GRANT_CONSENT',
          payload: { siteOrigin, purpose, fieldKeys: approvedKeys, expiresAt: null }
        });
        
        // 2. Request decrypted values for autofill
        const response = await chrome.runtime.sendMessage({
          type: 'REQUEST_AUTOFILL',
          payload: { siteOrigin, requestedFieldKeys: approvedKeys }
        });
        
        if (response && response.success && response.fields) {
          // 3. Fill the approved fields using the local element registry
          matchedFields.forEach(f => {
            if (approvedKeys.includes(f.fieldKey) && response.fields[f.fieldKey]) {
              const elRef = elementRegistry.get(f._tempId);
              const el = elRef ? elRef.deref() : null;
              if (el) {
                setNativeValue(el, response.fields[f.fieldKey]);
              }
            }
          });
          console.log('MahaSetu: Successfully autofilled approved fields.');
        } else {
          console.error('MahaSetu: Failed to retrieve autofill data', response);
        }
      } catch (err) {
        console.error('MahaSetu Autofill Error:', err);
      }
    });
  }

  /**
   * Initializes the scanner on page load.
   */
  async function initScanner() {
    const matchedFields = scanForm();
    
    if (matchedFields.length > 0) {
      const siteOrigin = window.location.origin;
      const fieldKeys = matchedFields.map(f => f.fieldKey);
      
      console.log(`MahaSetu Form Scanner detected ${matchedFields.length} identity field(s).`);
      
      // Send detection message to background worker
      // Note: background worker might simply ignore or forward this to a popup UI.
      try {
        await chrome.runtime.sendMessage({
          type: 'FORM_DETECTED',
          payload: {
            siteOrigin,
            matchedFieldKeys: fieldKeys
          }
        });
        
        showConsentPreview(matchedFields);
        
      } catch (err) {
        // Expected if background worker doesn't have an active listener specifically responding to this yet
        console.debug('MahaSetu message status (FORM_DETECTED):', err.message);
      }
    }
  }

  // Expose the scan function to window for manual testing in DevTools
  window.MahaSetuScanner = { scanForm, elementRegistry };

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScanner);
  } else {
    initScanner();
  }
})();
