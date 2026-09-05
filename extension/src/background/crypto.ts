const PBKDF2_ITERATIONS = 250_000;

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function generateSalt() {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function deriveKey(password: string, saltBase64: string) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: base64ToBytes(saltBase64),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function decryptField(ciphertextBase64: string, ivBase64: string, key: CryptoKey) {
  const decode = (value: string) => {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  };

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decode(ivBase64) },
    key,
    decode(ciphertextBase64),
  );
  return new TextDecoder().decode(plaintext);
}
