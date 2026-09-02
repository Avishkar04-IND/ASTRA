import type { ExtensionMessage } from "../types";

chrome.runtime.onInstalled.addListener(() => {
  console.log("MahaSetu extension installed.");
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (message.type === "FORM_DETECTED") {
    console.log("MahaSetu detected form fields", message.payload);
    sendResponse({ success: true });
    return false;
  }

  if (message.type === "GRANT_CONSENT") {
    chrome.storage.local.set({
      latestConsent: {
        ...message.payload,
        grantedAt: new Date().toISOString(),
        prototypeOnly: true,
      },
    });
    sendResponse({ success: true });
    return false;
  }

  if (message.type === "SCAN_PAGE" || message.type === "AUTOFILL_FORM") {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ success: false, message: "No active tab found." });
      return false;
    }

    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, message: chrome.runtime.lastError.message });
        return;
      }

      sendResponse(response || { success: false, message: "No response from page." });
    });
    return true;
  }

  sendResponse({ success: false, message: "Unknown message type." });
  return false;
});
