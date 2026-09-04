import type { ExtensionMessage } from "../types";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "",
  import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  {
    auth: {
      storage: {
        getItem: async (key) => {
          const value = (await chrome.storage.local.get(key))[key];
          return typeof value === "string" ? value : null;
        },
        setItem: async (key, value) => chrome.storage.local.set({ [key]: value }),
        removeItem: async (key) => chrome.storage.local.remove(key),
      },
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_STORAGE_KEY = "mahasetuSession";

type StoredSession = {
  userId: string;
  email: string;
  expiresAt: number;
};

let activeSession: StoredSession | null = null;

async function restoreSession() {
  const stored = (await chrome.storage.local.get(SESSION_STORAGE_KEY))[SESSION_STORAGE_KEY] as
    | StoredSession
    | undefined;

  if (!stored || stored.expiresAt <= Date.now()) {
    await chrome.storage.local.remove(SESSION_STORAGE_KEY);
    activeSession = null;
    return;
  }

  activeSession = stored;
}

async function getSession() {
  if (!activeSession) await restoreSession();
  if (activeSession && activeSession.expiresAt <= Date.now()) {
    await chrome.storage.local.remove(SESSION_STORAGE_KEY);
    activeSession = null;
  }
  return activeSession;
}

void restoreSession();

chrome.runtime.onInstalled.addListener(() => {
  console.log("MahaSetu extension installed.");
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  (async () => {
    if (message.type === "LOGIN") {
      const { email, password } = message.payload;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw error || new Error("Login failed.");

      const storedSession: StoredSession = {
        userId: data.user.id,
        email: data.user.email || email,
        expiresAt: Date.now() + SESSION_DURATION_MS,
      };
      activeSession = storedSession;
      await chrome.storage.local.set({ [SESSION_STORAGE_KEY]: storedSession });
      sendResponse({ success: true, email: storedSession.email, expiresAt: storedSession.expiresAt });
      return;
    }

    if (message.type === "LOGOUT") {
      await supabase.auth.signOut();
      activeSession = null;
      await chrome.storage.local.remove(SESSION_STORAGE_KEY);
      sendResponse({ success: true });
      return;
    }

    if (message.type === "GET_SESSION_STATUS") {
      const session = await getSession();
      sendResponse({ success: true, loggedIn: !!session, email: session?.email, expiresAt: session?.expiresAt });
      return;
    }

    if (message.type === "FORM_DETECTED") {
      console.log("MahaSetu detected form fields", message.payload);
      sendResponse({ success: true });
      return;
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
      return;
    }

    if (message.type === "SCAN_PAGE" || message.type === "AUTOFILL_FORM") {
      const tabId = sender.tab?.id;
      if (!tabId) {
        sendResponse({ success: false, message: "No active tab found." });
        return;
      }

      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, message: chrome.runtime.lastError.message });
          return;
        }
        sendResponse(response || { success: false, message: "No response from page." });
      });
      return;
    }

    sendResponse({ success: false, message: "Unknown message type." });
  })().catch((error: unknown) => {
    sendResponse({ success: false, message: error instanceof Error ? error.message : "Request failed." });
  });
  return true;
});
