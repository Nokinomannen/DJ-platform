/** Public URL for an uploaded file. Kept free of Node imports so client components can use it. */
export function mediaUrl(key: string) {
  return `/api/media/${key}`;
}
