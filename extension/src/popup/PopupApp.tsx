import { useEffect, useState } from "react";
import type { MessageResponse } from "../types";

type RuntimeAction = "SCAN_PAGE" | "AUTOFILL_FORM";

export function PopupApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState<number>();
  const [status, setStatus] = useState("Extension active");
  const [notice, setNotice] = useState("Open the mock portal, then scan or autofill.");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_SESSION_STATUS" }, (response: MessageResponse) => {
      if (response?.loggedIn) {
        setLoggedIn(true);
        setSessionEmail(response.email || "");
        setExpiresAt(response.expiresAt);
      }
    });
  }, []);

  const login = () => {
    setIsLoading(true);
    setNotice("");
    chrome.runtime.sendMessage({ type: "LOGIN", payload: { email, password } }, (response: MessageResponse) => {
      setIsLoading(false);
      if (chrome.runtime.lastError || !response?.success) {
        setNotice(chrome.runtime.lastError?.message || response?.message || "Login failed.");
        return;
      }
      setLoggedIn(true);
      setSessionEmail(response.email || email);
      setExpiresAt(response.expiresAt);
      setPassword("");
      setStatus("Signed in");
      setNotice("You will stay signed in for 30 days unless you log out.");
    });
  };

  const logout = () => {
    chrome.runtime.sendMessage({ type: "LOGOUT" }, (response: MessageResponse) => {
      if (response?.success) {
        setLoggedIn(false);
        setSessionEmail("");
        setExpiresAt(undefined);
        setStatus("Signed out");
        setNotice("Sign in to use autofill.");
      }
    });
  };

  const sendMessage = async (type: RuntimeAction) => {
    if (!loggedIn) {
      setNotice("Sign in before using this action.");
      return;
    }
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

      {!loggedIn ? (
        <form onSubmit={(event) => { event.preventDefault(); login(); }} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" required style={inputStyle} />
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" required style={inputStyle} />
          <button type="submit" disabled={isLoading} style={primaryButton("#1447e6", isLoading)}>
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
          {notice && <div style={messageBox}>{notice}</div>}
        </form>
      ) : (
        <>
          <div style={{ marginBottom: "8px", fontWeight: 700, color: "#166534" }}>{status}</div>
          <div style={{ marginBottom: "16px", fontSize: "12px", color: "#64748b" }}>
            {sessionEmail}<br />Session expires {expiresAt ? new Date(expiresAt).toLocaleDateString() : "soon"}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => sendMessage("SCAN_PAGE")} disabled={isLoading} style={primaryButton("#1447e6", isLoading)}>
              {isLoading ? "Scanning..." : "Scan This Page"}
            </button>

            <button onClick={() => sendMessage("AUTOFILL_FORM")} disabled={isLoading} style={primaryButton("#166534", isLoading)}>
              {isLoading ? "Working..." : "Autofill With Consent"}
            </button>
            <button onClick={logout} style={secondaryButton}>Sign out</button>
          </div>

          {notice && <div style={messageBox}>{notice}</div>}
        </>
      )}

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

const inputStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "13px",
} as const;

const secondaryButton = {
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#334155",
  fontWeight: 700,
  cursor: "pointer",
} as const;
