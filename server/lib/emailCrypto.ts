import { EMAIL_CONFIG_SECRET } from "./config.ts";
import { base64url, base64urlDecode } from "./oauth.ts";

const KEY_ALGORITHM = "AES-GCM";
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;
const VERSION = "v1";

let cachedKey: CryptoKey | null = null;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const secretBytes = new TextEncoder().encode(EMAIL_CONFIG_SECRET);
  const digest = await crypto.subtle.digest("SHA-256", secretBytes);
  const keyBytes = new Uint8Array(digest).slice(0, KEY_LENGTH_BYTES);
  cachedKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: KEY_ALGORITHM },
    false,
    ["encrypt", "decrypt"],
  );
  return cachedKey;
}

export async function encryptText(plainText: string): Promise<string> {
  if (!plainText) return "";

  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const encoded = new TextEncoder().encode(plainText);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: KEY_ALGORITHM, iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(encoded),
  );

  return `${VERSION}.${base64url(iv)}.${base64url(new Uint8Array(cipherBuffer))}`;
}

export async function decryptText(cipherText: string): Promise<string> {
  if (!cipherText) return "";

  const [version, ivEncoded, payloadEncoded] = cipherText.split(".");
  if (version !== VERSION || !ivEncoded || !payloadEncoded) {
    throw new Error("Stored email credential format is invalid.");
  }

  const key = await getEncryptionKey();
  const iv = base64urlDecode(ivEncoded);
  const payload = base64urlDecode(payloadEncoded);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: KEY_ALGORITHM, iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(payload),
  );

  return new TextDecoder().decode(plainBuffer);
}
