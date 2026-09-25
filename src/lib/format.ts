const sek = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "SEK",
  maximumFractionDigits: 0,
});

export function formatSek(amount: number) {
  return sek.format(amount);
}

const longDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats a YYYY-MM-DD calendar date without shifting it across time zones. */
export function formatDate(isoDate: string) {
  return longDate.format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Stockholm",
  }).format(date);
}

/** Today's calendar date in Sweden as YYYY-MM-DD. */
export function todayInSweden(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Stockholm" }).format(now);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
