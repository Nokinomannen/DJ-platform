import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { CONTENT_TYPES, isValidKey, uploadPath } from "@/lib/storage";

function stream(filePath: string, start?: number, end?: number) {
  return Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
}

// Serves uploaded audio and images with Range support so the audio player can seek.
export async function GET(request: Request, ctx: RouteContext<"/api/media/[key]">) {
  const { key } = await ctx.params;
  if (!isValidKey(key)) return new Response("Not found", { status: 404 });

  const filePath = uploadPath(key);
  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) return new Response("Not found", { status: 404 });

  const ext = key.split(".").pop()!;
  const headers = new Headers({
    "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });

  const range = request.headers.get("range");
  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (match && (match[1] || match[2])) {
    const size = info.size;
    let start: number;
    let end: number;
    if (match[1]) {
      start = Number(match[1]);
      end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    } else {
      // Suffix range: the last N bytes.
      start = Math.max(size - Number(match[2]), 0);
      end = size - 1;
    }
    if (start > end || start >= size) {
      headers.set("Content-Range", `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));
    return new Response(stream(filePath, start, end), { status: 206, headers });
  }

  headers.set("Content-Length", String(info.size));
  return new Response(stream(filePath), { headers });
}
