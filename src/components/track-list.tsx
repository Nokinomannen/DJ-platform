import type { Track } from "@/lib/db/schema";
import { parseEmbed } from "@/lib/embeds";
import { mediaUrl } from "@/lib/media";
import { AudioPlayer } from "./audio-player";

const SOURCE_LABELS: Record<Track["source"], string> = {
  upload: "Upload",
  soundcloud: "SoundCloud",
  mixcloud: "Mixcloud",
  youtube: "YouTube",
  spotify: "Spotify",
};

export function TrackItem({ track }: { track: Track }) {
  if (track.source === "upload") {
    return <AudioPlayer src={mediaUrl(track.url)} title={track.title} />;
  }
  const embed = parseEmbed(track.url);
  if (!embed) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background/60">
      <p className="flex items-center justify-between px-4 pt-3 pb-2 text-sm font-medium">
        {track.title}
        <span className="chip">{SOURCE_LABELS[track.source]}</span>
      </p>
      <iframe
        title={track.title}
        src={embed.src}
        loading="lazy"
        allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
        className={embed.source === "youtube" ? "aspect-video w-full" : "w-full"}
        style={embed.height ? { height: embed.height } : undefined}
      />
    </div>
  );
}

export function TrackList({ tracks }: { tracks: Track[] }) {
  return (
    <div className="space-y-3">
      {tracks.map((track) => (
        <TrackItem key={track.id} track={track} />
      ))}
    </div>
  );
}

export { SOURCE_LABELS };
