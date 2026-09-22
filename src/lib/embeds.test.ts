import { describe, expect, it } from "vitest";
import { parseEmbed } from "./embeds";

describe("parseEmbed", () => {
  it("embeds SoundCloud tracks", () => {
    const e = parseEmbed("https://soundcloud.com/some-dj/summer-mix?si=abc");
    expect(e?.source).toBe("soundcloud");
    expect(e?.src).toContain(encodeURIComponent("https://soundcloud.com/some-dj/summer-mix"));
    expect(e?.src).not.toContain("si%3Dabc");
  });

  it("embeds Mixcloud shows", () => {
    const e = parseEmbed("https://www.mixcloud.com/some-dj/friday-set/");
    expect(e?.source).toBe("mixcloud");
    expect(e?.src).toContain(encodeURIComponent("/some-dj/friday-set/"));
  });

  it("embeds YouTube links in all common shapes", () => {
    for (const link of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://youtube.com/shorts/dQw4w9WgXcQ",
    ]) {
      expect(parseEmbed(link)?.src).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    }
  });

  it("embeds Spotify items, including localized links", () => {
    expect(parseEmbed("https://open.spotify.com/intl-sv/track/4uLU6hMCjMI75M1A2tKUQC")?.src).toBe(
      "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC",
    );
  });

  it("rejects unknown hosts and look-alike domains", () => {
    expect(parseEmbed("https://evil.com/soundcloud.com/x")).toBeNull();
    expect(parseEmbed("https://notsoundcloud.com/a/b")).toBeNull();
    expect(parseEmbed("javascript:alert(1)")).toBeNull();
    expect(parseEmbed("not a url")).toBeNull();
  });
});
