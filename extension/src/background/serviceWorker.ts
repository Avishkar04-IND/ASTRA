import type { ExtensionMessage } from "../types";
import { createClient } from "@supabase/supabase-js";
import { decryptField, deriveKey, generateSalt } from "./crypto";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use a synchronous in-memory store for Supabase auth session.
// The real persistent session is managed separately via `mahasetuSession` in
// chrome.storage.local (see storeSession / restoreSession below).
// Using an async storage adapter here crashes the service worker before its
// onMessage listener is registered, causing "Receiving end does not exist".
const _supabaseAuthMemStore: Record<string, string> = {};
const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || "",
  {
    auth: {
      storage: {
        getItem: (key) => _supabaseAuthMemStore[key] ?? null,
        setItem: (key, value) => { _supabaseAuthMemStore[key] = value; },
        removeItem: (key) => { delete _supabaseAuthMemStore[key]; },
      },
      persistSession: false,
      autoRefreshToken: false,
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
let sessionKey: CryptoKey | null = null;

async function restoreSession() {
  const stored = (await chrome.storage.local.get(SESSION_STORAGE_KEY))[SESSION_STORAGE_KEY] as
    | StoredSession
    | undefined;

  if (!stored || stored.expiresAt <= Date.now()) {
    await chrome.storage.local.remove(SESSION_STORAGE_KEY);
    activeSession = null;
    sessionKey = null;
    return;
  }

  activeSession = stored;
}

async function getSession() {
  if (!activeSession) await restoreSession();
  if (activeSession && activeSession.expiresAt <= Date.now()) {
    await chrome.storage.local.remove(SESSION_STORAGE_KEY);
    activeSession = null;
    sessionKey = null;
  }
  return activeSession;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (error && typeof error === "object" && "error_description" in error) {
    const description = (error as { error_description?: unknown }).error_description;
    if (typeof description === "string" && description.trim()) return description;
  }
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && code.trim()) return code;
  }
  return "";
}

function formatAuthError(error: unknown) {
  const message = getErrorMessage(error);
  if (!message) {
    return "Authentication failed. Open chrome://extensions, click service worker Inspect, and check the console.";
  }

  if (/invalid login credentials/i.test(message)) {
    return "Invalid email or password. Create an account first if this email is new.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Email is not confirmed yet. Check your inbox or disable email confirmation in Supabase for the demo.";
  }
  if (/rate limit/i.test(message)) {
    return "Supabase email rate limit exceeded. For development/demo, disable 'Confirm email' under Supabase Dashboard > Authentication > Providers > Email.";
  }
  if (/email address .* is invalid/i.test(message)) {
    return "Please enter a valid email address (e.g. name@example.com).";
  }
  if (/failed to fetch|network/i.test(message)) {
    return "Could not reach Supabase. Check internet access and extension/.env, then rebuild and reload the extension.";
  }
  if (/row-level security|violates row-level security|permission denied/i.test(message)) {
    return "Supabase blocked profile setup. Run the Supabase migrations/RLS policies, or create the account from the dashboard first.";
  }
  if (/profiles|key_derivation_salt|relation .* does not exist/i.test(message)) {
    return "Supabase profile table is not ready. Apply the migrations in supabase/migrations before using extension login.";
  }

  return message;
}

async function ensureProfileSalt(userId: string, email: string) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("key_derivation_salt")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw profileError;

  if (profile?.key_derivation_salt && typeof profile.key_derivation_salt === "string" && profile.key_derivation_salt.trim().length > 0) {
    return profile.key_derivation_salt as string;
  }

  const salt = generateSalt();
  const { error: profileInsertError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      key_derivation_salt: salt,
    },
    { onConflict: "id" },
  );
  if (profileInsertError) throw profileInsertError;

  return salt;
}

async function storeSession(userId: string, email: string) {
  const storedSession: StoredSession = {
    userId,
    email,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  activeSession = storedSession;
  await chrome.storage.local.set({ [SESSION_STORAGE_KEY]: storedSession });
  return storedSession;
}

void restoreSession();

chrome.runtime.onInstalled.addListener(() => {
  console.log("MahaSetu extension installed.");
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  (async () => {
    if (message.type === "LOGIN") {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase configuration is missing. Create extension/.env and rebuild the extension.");
      }
      const { email, password } = message.payload;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw error || new Error("Login failed.");

      const sessionEmail = data.user.email || email;
      try {
        const salt = await ensureProfileSalt(data.user.id, sessionEmail);
        sessionKey = await deriveKey(password, salt);
        const storedSession = await storeSession(data.user.id, sessionEmail);
        sendResponse({ success: true, email: storedSession.email, expiresAt: storedSession.expiresAt });
      } catch (setupError) {
        sessionKey = null;
        activeSession = null;
        await supabase.auth.signOut();
        throw setupError;
      }
      return;
    }

    if (message.type === "SIGNUP") {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase configuration is missing. Create extension/.env and rebuild the extension.");
      }
      const { email, password } = message.payload;
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error || !data.user) throw error || new Error("Account creation failed.");

      const sessionEmail = data.user.email || email;
      if (!data.session) {
        sendResponse({
          success: true,
          loggedIn: false,
          email: sessionEmail,
          message:
            "Account created, but Supabase did not return a session. Confirm your email first, then sign in again. If this email already exists, use Sign in.",
        });
        return;
      }

      const salt = await ensureProfileSalt(data.user.id, sessionEmail);
      sessionKey = await deriveKey(password, salt);
      const storedSession = await storeSession(data.user.id, sessionEmail);
      sendResponse({
        success: true,
        email: storedSession.email,
        expiresAt: storedSession.expiresAt,
        message: data.session
          ? "Account created and signed in."
          : "Account created. If email confirmation is enabled, confirm your email before signing in again.",
      });
      return;
    }

    if (message.type === "LOGOUT") {
      await supabase.auth.signOut();
      activeSession = null;
      sessionKey = null;
      await chrome.storage.local.remove(SESSION_STORAGE_KEY);
      sendResponse({ success: true });
      return;
    }

    if (message.type === "GET_SESSION_STATUS") {
      const session = await getSession();
      // supabase.auth.getSession() always returns null after a service-worker
      // restart because we use persistSession:false (in-memory only).
      // The custom mahasetuSession stored in chrome.storage.local is the
      // authoritative source of truth for whether the user is authenticated.
      const authenticated = !!session; // has a valid, non-expired custom session
      sendResponse({
        success: true,
        loggedIn: authenticated && !!sessionKey, // also has crypto key in memory
        authenticated,
        needsUnlock: authenticated && !sessionKey, // session exists but key needs re-derive
        email: session?.email,
        expiresAt: session?.expiresAt,
      });
      return;
    }

    if (message.type === "FORM_DETECTED") {
      console.log("MahaSetu detected form fields", message.payload);
      sendResponse({ success: true });
      return;
    }

    if (message.type === "GRANT_CONSENT") {
      if (!activeSession) throw new Error("Sign in to the extension before granting consent.");
      const { error: consentError } = await supabase.from("consents").insert({
        user_id: activeSession.userId,
        site_origin: message.payload.siteOrigin,
        purpose: message.payload.purpose,
        field_keys: message.payload.fieldKeys,
        status: "active",
        expires_at: message.payload.expiresAt || null,
      });
      if (consentError) throw consentError;
      sendResponse({ success: true });
      return;
    }

    if (message.type === "REQUEST_AUTOFILL") {
      if (!activeSession || !sessionKey) throw new Error("Sign in to the extension before autofill.");
      const { siteOrigin, requestedFieldKeys } = message.payload;
      const { data: consents, error: consentError } = await supabase
        .from("consents")
        .select("field_keys, expires_at")
        .eq("user_id", activeSession.userId)
        .eq("site_origin", siteOrigin)
        .eq("status", "active");
      if (consentError) throw consentError;

      const now = Date.now();
      const approved = new Set<string>();
      for (const consent of consents || []) {
        if (!consent.expires_at || new Date(consent.expires_at).getTime() > now) {
          for (const fieldKey of consent.field_keys || []) approved.add(fieldKey);
        }
      }

      const allowedKeys = requestedFieldKeys.filter((fieldKey) => approved.has(fieldKey));
      const decrypted: Record<string, string> = {};
      if (allowedKeys.length > 0) {
        const { data: fields, error: fieldsError } = await supabase
          .from("profile_fields")
          .select("field_key, field_value_ciphertext, field_value_iv")
          .eq("user_id", activeSession.userId)
          .in("field_key", allowedKeys);
        if (fieldsError) throw fieldsError;

        for (const field of fields || []) {
          decrypted[field.field_key] = await decryptField(field.field_value_ciphertext, field.field_value_iv, sessionKey);
        }
      }
      sendResponse({ success: true, profileFields: decrypted, missingConsents: requestedFieldKeys.filter((key) => !approved.has(key)) });
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
    sendResponse({
      success: false,
      message: formatAuthError(error),
      error: getErrorMessage(error),
    });
  });
  return true;
});
