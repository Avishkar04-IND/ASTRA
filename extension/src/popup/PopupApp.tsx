import { useEffect, useState } from "react";
import type { MessageResponse } from "../types";

/** Retry sendMessage a few times to handle service-worker wakeup race. */
async function sendMessageWithRetry(
  message: object,
  retries = 5,
  delayMs = 400,
): Promise<MessageResponse> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await chrome.runtime.sendMessage(message) as MessageResponse;
      return response;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < retries - 1 && /receiving end does not exist/i.test(msg)) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Extension service worker did not respond. Try reloading the extension at chrome://extensions.");
}

type RuntimeAction = "SCAN_PAGE" | "AUTOFILL_FORM";

export function PopupApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState<number>();
  const [status, setStatus] = useState("Extension active");
  const [notice, setNotice] = useState("Open the mock portal, then scan or autofill.");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void sendMessageWithRetry({ type: "GET_SESSION_STATUS" }).then((response: MessageResponse) => {
      if (response?.loggedIn) {
        setLoggedIn(true);
        setNeedsUnlock(false);
        setSessionEmail(response.email || "");
        setExpiresAt(response.expiresAt);
      } else if (response?.needsUnlock) {
        setNeedsUnlock(true);
        if (response.email) {
          setEmail(response.email);
          setSessionEmail(response.email);
        }
        setStatus("Session found");
        setNotice("Enter your password to unlock the extension.");
      }
    }).catch((error: unknown) => {
      setStatus("Extension needs to be reloaded");
      setNotice(error instanceof Error ? error.message : "Could not connect to the background service.");
    });
  }, []);

  const authenticate = async (type: "LOGIN" | "SIGNUP") => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setNotice("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    setNotice("");
    try {
      const response = await chrome.runtime.sendMessage({ type, payload: { email: trimmedEmail, password } }) as MessageResponse;
      setIsLoading(false);
      if (!response?.success) throw new Error(response?.message || response?.error || "Authentication failed.");
      if (response.loggedIn === false) {
        setLoggedIn(false);
        setNeedsUnlock(false);
        setSessionEmail(response.email || trimmedEmail);
        setExpiresAt(undefined);
        setStatus("Email confirmation needed");
        setNotice(response.message || "Confirm your email first, then sign in again.");
        return;
      }
      setLoggedIn(true);
      setNeedsUnlock(false);
      setSessionEmail(response.email || trimmedEmail);
      setExpiresAt(response.expiresAt);
      setPassword("");
      setStatus(type === "LOGIN" ? "Signed in" : "Account ready");
      setNotice(response.message || "You will stay signed in for 30 days unless you log out.");
    } catch (error: unknown) {
      setIsLoading(false);
      setStatus("Authentication failed");
      setNotice(error instanceof Error ? error.message : String(error || "Check the extension service worker."));
    }
  };

  const logout = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: "LOGOUT" }) as MessageResponse;
      if (response?.success) {
        setLoggedIn(false);
        setNeedsUnlock(false);
        setEmail("");
        setPassword("");
        setSessionEmail("");
        setExpiresAt(undefined);
        setStatus("Signed out");
        setNotice("Sign in to use autofill.");
      }
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : "Could not contact the extension service.");
    }
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
        setIsLoading(false);
        return;
      }

      if (type === "AUTOFILL_FORM") {
        // AUTOFILL_FORM shows a consent panel that the user must interact with ON the page.
        // The popup must close so the user can click the panel — if the popup stays open
        // it steals focus and the message channel tears down before sendResponse fires.
        // Fire-and-forget: send the message, then close the popup immediately.
        // The content script's own showNotice() handles completion feedback.
        chrome.tabs.sendMessage(tab.id, { type }, () => {
          // Suppress "Receiving end does not exist" if content script isn't injected yet.
          void chrome.runtime.lastError;
        });
        window.close();
        return;
      }

      // SCAN_PAGE: response is synchronous (no user interaction needed), safe to await.
      chrome.tabs.sendMessage(tab.id, { type }, (response: MessageResponse) => {
        if (chrome.runtime.lastError) {
          const errMsg = chrome.runtime.lastError.message || "";
          setStatus("Extension error");
          setNotice(
            /receiving end does not exist/i.test(errMsg)
              ? "Content script not found on this tab. Please refresh the page and try again."
              : errMsg || "Could not connect to this page.",
          );
          setIsLoading(false);
          return;
        }

        if (!response?.success) {
          setStatus("Unable to complete action");
          setNotice(response?.message || "No response from the page.");
          setIsLoading(false);
          return;
        }

        const count = response.fields?.length ?? 0;
        setStatus(`Detected ${count} field${count === 1 ? "" : "s"}`);
        setNotice("Autofill will ask for field-level consent before sharing mock data.");
        setIsLoading(false);
      });
    } catch (error) {
      setStatus("Extension error");
      setNotice(error instanceof Error ? error.message : "Unknown runtime error.");
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
        <form onSubmit={(event) => { event.preventDefault(); authenticate("LOGIN"); }} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {needsUnlock ? (
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", background: "#f1f5f9", padding: "8px 10px", borderRadius: "6px" }}>
              Unlock vault: <span style={{ color: "#2563eb" }}>{sessionEmail || email}</span>
            </div>
          ) : (
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" required style={inputStyle} />
          )}
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder={needsUnlock ? "Enter your password to unlock" : "Password"} required style={inputStyle} />
          <button type="submit" disabled={isLoading} style={primaryButton("#1447e6", isLoading)}>
            {isLoading ? (needsUnlock ? "Unlocking..." : "Signing in...") : (needsUnlock ? "Unlock Vault" : "Sign in")}
          </button>
          {needsUnlock ? (
            <button type="button" onClick={logout} disabled={isLoading} style={secondaryButton}>
              Use different account
            </button>
          ) : (
            <button type="button" onClick={() => authenticate("SIGNUP")} disabled={isLoading} style={secondaryButton}>
              Create account
            </button>
          )}
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
