import { useState } from "react";
import type { MessageResponse } from "../types";

type RuntimeAction = "SCAN_PAGE" | "AUTOFILL_FORM";

export function PopupApp() {
  const [status, setStatus] = useState("Extension active");
  const [notice, setNotice] = useState("Open the mock portal, then scan or autofill.");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (type: RuntimeAction) => {
    setIsLoading(true);
    setNotice("");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id || !tab.url || !tab.url.startsWith("http")) {
        setStatus("Open a local mock portal first");
        setNotice("MahaSetu is limited to local mock/sandbox pages in this prototype.");
        return;
      }

      chrome.tabs.sendMessage(tab.id, { type }, (response: MessageResponse) => {
        if (chrome.runtime.lastError) {
          setStatus("Extension error");
          setNotice(chrome.runtime.lastError.message || "Could not connect to this page.");
          setIsLoading(false);
          return;
        }

        if (!response?.success) {
          setStatus("Unable to complete action");
          setNotice(response?.message || "No response from the page.");
          setIsLoading(false);
          return;
        }

        if (type === "SCAN_PAGE") {
          const count = response.fields?.length ?? 0;
          setStatus(`Detected ${count} field${count === 1 ? "" : "s"}`);
          setNotice("Autofill will ask for field-level consent before sharing mock data.");
        }

        if (type === "AUTOFILL_FORM") {
          const count = response.filled?.length ?? 0;
          setStatus(`Filled ${count} field${count === 1 ? "" : "s"}`);
          setNotice(response.message || "Autofill complete.");
        }

        setIsLoading(false);
      });
    } catch (error) {
      setStatus("Extension error");
      setNotice(error instanceof Error ? error.message : "Unknown runtime error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "18px 16px", color: "#0f172a" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: "24px" }}>MahaSetu</h2>
      <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#64748b" }}>
        Fill once, apply anywhere
      </p>

      <div style={{ marginBottom: "16px", fontWeight: 700, color: "#166534" }}>{status}</div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button onClick={() => sendMessage("SCAN_PAGE")} disabled={isLoading} style={primaryButton("#1447e6", isLoading)}>
          {isLoading ? "Scanning..." : "Scan This Page"}
        </button>

        <button
          onClick={() => sendMessage("AUTOFILL_FORM")}
          disabled={isLoading}
          style={primaryButton("#166534", isLoading)}
        >
          {isLoading ? "Working..." : "Autofill With Consent"}
        </button>
      </div>

      {notice && <div style={messageBox}>{notice}</div>}

      <div style={{ marginTop: "12px", fontSize: "12px", lineHeight: 1.4, color: "#64748b" }}>
        Prototype mode: uses synthetic data only. DigiLocker/API Setu and government APIs remain mock or sandbox.
      </div>
    </div>
  );
}

function primaryButton(background: string, disabled: boolean) {
  return {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "none",
    background,
    color: "#fff",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.72 : 1,
  } as const;
}

const messageBox = {
  marginTop: "14px",
  padding: "10px 12px",
  borderRadius: "8px",
  fontSize: "13px",
  background: "#ecfeff",
  border: "1px solid #a5f3fc",
  color: "#0f172a",
  lineHeight: 1.4,
} as const;
