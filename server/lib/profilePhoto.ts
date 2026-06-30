import { decode as decodePng } from "@jsquash/png";
import { decode as decodeJpeg } from "@jsquash/jpeg";
import { decode as decodeWebp, encode as encodeWebp } from "@jsquash/webp";
import resize from "@jsquash/resize";

// Profile photos are normalized to a single format on upload: every accepted
// input (PNG / JPEG / WebP) is decoded to raw pixels and re-encoded as WebP.
// Re-encoding also discards all source metadata (EXIF/GPS, IPTC, XMP), so no
// location data can ever be persisted (RA 10173 data-protection).
export const PROFILE_PHOTO_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

// Stored extension is always this — there is exactly one format on disk.
export const PROFILE_PHOTO_EXTENSION = "webp";

const MAX_DIMENSION = 512; // longest edge; avatars never need more
const WEBP_QUALITY = 82;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  // Copy into a fresh, non-shared ArrayBuffer the codecs can take ownership of.
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function decodeToImageData(bytes: Uint8Array, mimeType: string) {
  const buffer = toArrayBuffer(bytes);
  switch (mimeType) {
    case "image/png":
      return await decodePng(buffer);
    case "image/jpeg":
      return await decodeJpeg(buffer);
    case "image/webp":
      return await decodeWebp(buffer);
    default:
      throw new Error(`Unsupported image type: ${mimeType}`);
  }
}

/**
 * Decode an accepted image, downscale so its longest edge is <= MAX_DIMENSION,
 * and encode it as WebP. Throws if the bytes cannot be decoded (corrupt or a
 * disallowed format masquerading as an accepted MIME type).
 */
export async function processToWebp(
  bytes: Uint8Array,
  mimeType: string,
): Promise<Uint8Array> {
  let imageData = await decodeToImageData(bytes, mimeType);

  const longest = Math.max(imageData.width, imageData.height);
  if (longest > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / longest;
    imageData = await resize(imageData, {
      width: Math.max(1, Math.round(imageData.width * scale)),
      height: Math.max(1, Math.round(imageData.height * scale)),
    });
  }

  const encoded = await encodeWebp(imageData, { quality: WEBP_QUALITY });
  return new Uint8Array(encoded);
}
