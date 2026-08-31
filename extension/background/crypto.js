/**
 * MahaSetu — Client-Side Encryption Utilities
 * Web Crypto API, AES-256-GCM
 *
 * Locked-in design rules this file follows:
 *   - Hashing != Encryption. This file is encryption only (two-way,
 *     retrievable). Password hashing is handled entirely by Supabase Auth
 *     and never touches this module.
 *   - The derived AES key lives ONLY in memory, for the lifetime of the
 *     background service worker session. It is never written to
 *     chrome.storage, localStorage, IndexedDB, or sent over the network.
 *   - A fresh random IV is generated for every encryption call. Reusing
 *     an IV with the same key breaks AES-GCM's security guarantees.
 *   - The server (Supabase) only ever receives/stores ciphertext + iv.
 *
 * Intended home: extension background service worker.
 * Import into content scripts / dashboard only through message-passing —
 * never duplicate the key into another execution context.
 */

const PBKDF2_ITERATIONS = 250_000; // OWASP-recommended floor as of 2024; adjust if perf testing demands it
const AES_KEY_LENGTH = 256;
const IV_LENGTH_BYTES = 12; // 96 bits, the recommended IV size for AES-GCM
const SALT_LENGTH_BYTES = 16;

// ---------------------------------------------------------------------
// Encoding helpers
// ---------------------------------------------------------------------

function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Generates a new random salt for a first-time user. Store this salt
 * (it is NOT secret) alongside the user's profile — e.g. in the
 * `profiles` table as `key_derivation_salt`. It is required every
 * subsequent login to re-derive the same key.
 */
export function generateSalt() {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
    return bufferToBase64(salt);
}

// ---------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------

/**
 * Derives a 256-bit AES-GCM CryptoKey from the user's password and a
 * stored (non-secret) salt, using PBKDF2.
 *
 * IMPORTANT: call this once at login inside the background service
 * worker, keep the returned CryptoKey in a module-level variable there,
 * and never export/serialize it. If you need to use the key from a
 * content script or dashboard tab, send the plaintext field value
 * across via chrome.runtime.sendMessage and have the background worker
 * do the encrypt/decrypt — don't move the key itself.
 *
 * @param {string} password - the user's login password (never stored)
 * @param {string} saltBase64 - the user's stored salt, base64-encoded
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKey(password, saltBase64) {
    const enc = new TextEncoder();
    const salt = base64ToBuffer(saltBase64);

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: PBKDF2_ITERATIONS,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: AES_KEY_LENGTH },
        false, // not extractable — cannot be exported out of the CryptoKey object
        ["encrypt", "decrypt"]
    );
}

// ---------------------------------------------------------------------
// Field encryption / decryption
// ---------------------------------------------------------------------

/**
 * Encrypts a single field's plaintext value.
 *
 * @param {string} plaintext - e.g. the raw Aadhaar number
 * @param {CryptoKey} key - the in-memory derived key
 * @returns {Promise<{ciphertext: string, iv: string}>} both base64-encoded,
 *   ready to store directly in profile_fields.field_value_ciphertext /
 *   profile_fields.field_value_iv
 */
export async function encryptField(plaintext, key) {
    if (typeof plaintext !== "string" || plaintext.length === 0) {
        throw new Error("encryptField: plaintext must be a non-empty string");
    }

    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
    const enc = new TextEncoder();

    const ciphertextBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(plaintext)
    );

    return {
        ciphertext: bufferToBase64(ciphertextBuffer),
        iv: bufferToBase64(iv),
    };
}

/**
 * Decrypts a single field back to plaintext.
 *
 * @param {string} ciphertextBase64
 * @param {string} ivBase64
 * @param {CryptoKey} key
 * @returns {Promise<string>} the original plaintext
 * @throws if the key is wrong or the ciphertext has been tampered with
 *   (AES-GCM's built-in authentication tag will fail verification)
 */
export async function decryptField(ciphertextBase64, ivBase64, key) {
    const ciphertext = base64ToBuffer(ciphertextBase64);
    const iv = base64ToBuffer(ivBase64);

    const plaintextBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv) },
        key,
        ciphertext
    );

    return new TextDecoder().decode(plaintextBuffer);
}

// ---------------------------------------------------------------------
// Display masking (client-side, post-decryption only)
// ---------------------------------------------------------------------

/**
 * Masks a decrypted value for on-screen display, based on its format_type.
 * This NEVER runs server-side — the server never has plaintext to mask.
 * Add new format_type cases as new field types are introduced.
 *
 * @param {string} plaintext - the decrypted value
 * @param {string} formatType - matches profile_fields.format_type
 * @returns {string} masked display string
 */
export function maskValue(plaintext, formatType) {
    if (!plaintext) return "";

    switch (formatType) {
        case "aadhaar": {
            // 12 digits -> XXXX-XXXX-1234
            const digits = plaintext.replace(/\D/g, "");
            if (digits.length !== 12) return "••••-••••-••••";
            return `XXXX-XXXX-${digits.slice(-4)}`;
        }
        case "pan": {
            // 10 chars, e.g. ABCDE1234F -> XXXXX1234X-style partial reveal
            if (plaintext.length !== 10) return "••••••••••";
            return `${"X".repeat(5)}${plaintext.slice(5, 9)}X`;
        }
        case "phone": {
            const digits = plaintext.replace(/\D/g, "");
            if (digits.length < 4) return "••••••••••";
            return `${"X".repeat(digits.length - 4)}${digits.slice(-4)}`;
        }
        case "email": {
            const [local, domain] = plaintext.split("@");
            if (!domain) return "••••@••••";
            const visible = local.slice(0, 2);
            return `${visible}${"X".repeat(Math.max(local.length - 2, 1))}@${domain}`;
        }
        default:
            // generic fallback: show only the last 4 characters
            if (plaintext.length <= 4) return "•".repeat(plaintext.length);
            return `${"•".repeat(plaintext.length - 4)}${plaintext.slice(-4)}`;
    }
}
