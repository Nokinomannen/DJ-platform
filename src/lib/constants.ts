export const CATEGORIES = [
  { id: "dj", label: "DJ", plural: "DJs", blurb: "Från bröllop till klubbnätter" },
  { id: "band", label: "Band", plural: "Band", blurb: "Liveband för alla tillfällen" },
  { id: "musician", label: "Livemusiker", plural: "Livemusiker", blurb: "Sångare, sax, gitarr och mer" },
  { id: "sound", label: "Ljud & ljus", plural: "Ljud & ljus", blurb: "Hyr PA, ljus och tekniker" },
  { id: "planner", label: "Festfixare", plural: "Festfixare", blurb: "De som fixar helheten" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];

export function categoryLabel(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export const GENRES = [
  "House",
  "Techno",
  "Disco",
  "Hip hop",
  "R&B",
  "Afrobeats",
  "Pop",
  "Schlager",
  "Reggaeton",
  "Dancehall",
  "Drum & bass",
  "Funk & soul",
  "80-tal",
  "Jazz",
  "Akustiskt",
  "Latin",
] as const;

export const EVENT_TYPES = [
  { id: "wedding", label: "Bröllop" },
  { id: "birthday", label: "Födelsedag" },
  { id: "corporate", label: "Företagsevent" },
  { id: "private", label: "Privat fest" },
  { id: "club", label: "Klubb/bar" },
  { id: "student", label: "Studentfest" },
  { id: "other", label: "Annat" },
] as const;

export function eventTypeLabel(id: string) {
  return EVENT_TYPES.find((e) => e.id === id)?.label ?? id;
}

export const BOOKING_STATUS_LABELS = {
  pending: "Väntar på svar",
  accepted: "Bekräftad",
  declined: "Nekad",
  cancelled: "Avbokad",
} as const;
