"use client";

import { useEffect, useRef, useState } from "react";

const PLAY_EVENT = "gigga:audio-play";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Minimal audio player. Starting one player pauses any other on the page. */
export function AudioPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const onOtherPlay = (event: Event) => {
      if ((event as CustomEvent).detail !== audioRef.current) audioRef.current?.pause();
    };
    window.addEventListener(PLAY_EVENT, onOtherPlay);
    return () => window.removeEventListener(PLAY_EVENT, onOtherPlay);
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: audio }));
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-background/60 p-3 pr-5">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:brightness-110"
      >
        {playing ? (
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="ml-0.5 size-5" fill="currentColor" aria-hidden>
            <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z" />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={time}
            aria-label="Seek"
            onChange={(e) => {
              const audio = audioRef.current;
              if (audio) audio.currentTime = Number(e.target.value);
            }}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full accent-[var(--accent)]"
            style={{ background: `linear-gradient(to right, var(--accent) ${progress}%, var(--border) ${progress}%)` }}
          />
          <span className="w-20 text-right font-mono text-xs text-muted tabular-nums">
            {formatTime(time)} / {formatTime(duration)}
          </span>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
    </div>
  );
}
