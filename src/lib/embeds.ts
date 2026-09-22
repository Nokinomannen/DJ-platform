export type EmbedSource = "soundcloud" | "mixcloud" | "youtube" | "spotify";

export type Embed = { source: EmbedSource; src: string; height: number };

const SPOTIFY_TYPES = new Set(["track", "album", "playlist", "episode", "show", "artist"]);

function hostMatches(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

/** Turns a public SoundCloud/Mixcloud/YouTube/Spotify link into an embeddable player URL. */
export function parseEmbed(raw: string): Embed | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/\/+$/, "");

  if (hostMatches(host, "soundcloud.com") && path.split("/").filter(Boolean).length >= 1) {
    const clean = `https://soundcloud.com${path}`;
    return {
      source: "soundcloud",
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(clean)}&color=%23d4ff3f&auto_play=false&hide_related=true&show_comments=false&show_reposts=false&visual=false`,
      height: 166,
    };
  }

  if (hostMatches(host, "mixcloud.com") && path.split("/").filter(Boolean).length >= 2) {
    return {
      source: "mixcloud",
      src: `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(`${path}/`)}`,
      height: 120,
    };
  }

  if (hostMatches(host, "youtube.com") || host === "youtu.be") {
    const videoId =
      host === "youtu.be"
        ? path.slice(1)
        : path === "/watch"
          ? url.searchParams.get("v")
          : path.startsWith("/shorts/") || path.startsWith("/embed/")
            ? path.split("/")[2]
            : null;
    if (!videoId || !/^[\w-]{6,20}$/.test(videoId)) return null;
    return {
      source: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${videoId}`,
      height: 0,
    };
  }

  if (host === "open.spotify.com") {
    const [type, itemId] = path.split("/").filter(Boolean).filter((p) => !p.startsWith("intl-"));
    if (!type || !itemId || !SPOTIFY_TYPES.has(type) || !/^\w+$/.test(itemId)) return null;
    return {
      source: "spotify",
      src: `https://open.spotify.com/embed/${type}/${itemId}`,
      height: 152,
    };
  }

  return null;
}
