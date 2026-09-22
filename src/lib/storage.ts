import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Local disk storage for development. Swap for S3/R2/Supabase Storage in production.
// turbopackIgnore keeps the build from tracing the whole project through these runtime paths.
const UPLOAD_ROOT = path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "data/uploads");

export const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/ogg": "ogg",
};

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const CONTENT_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const KEY_PATTERN = /^[a-f0-9-]{36}\.(mp3|m4a|aac|wav|ogg|jpg|png|webp)$/;

export function isValidKey(key: string) {
  return KEY_PATTERN.test(key);
}

export function uploadPath(key: string) {
  if (!isValidKey(key)) throw new Error("Invalid upload key");
  return path.join(/* turbopackIgnore: true */ UPLOAD_ROOT, key);
}

export async function saveUpload(file: File, allowed: Record<string, string>) {
  const ext = allowed[file.type];
  if (!ext) throw new Error(`Unsupported file type: ${file.type}`);
  await mkdir(UPLOAD_ROOT, { recursive: true });
  const key = `${randomUUID()}.${ext}`;
  await writeFile(uploadPath(key), Buffer.from(await file.arrayBuffer()));
  return key;
}

export async function saveBuffer(buffer: Buffer, ext: string) {
  await mkdir(UPLOAD_ROOT, { recursive: true });
  const key = `${randomUUID()}.${ext}`;
  await writeFile(uploadPath(key), buffer);
  return key;
}

export async function deleteUpload(key: string) {
  if (!isValidKey(key)) return;
  await unlink(uploadPath(key)).catch(() => undefined);
}
