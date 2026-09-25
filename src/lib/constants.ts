export const CATEGORIES = [
  { id: "dj", label: "DJ", plural: "DJs", blurb: "From weddings to club nights" },
  { id: "band", label: "Band", plural: "Bands", blurb: "Live bands for any occasion" },
  { id: "musician", label: "Live musician", plural: "Live musicians", blurb: "Singers, sax, guitar and more" },
  { id: "sound", label: "Sound & lights", plural: "Sound & lights", blurb: "Rent PA, lights and techs" },
  { id: "planner", label: "Party planner", plural: "Party planners", blurb: "The people who handle it all" },
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
  "80s",
  "Jazz",
  "Acoustic",
  "Latin",
] as const;

export const EVENT_TYPES = [
  { id: "wedding", label: "Wedding" },
  { id: "birthday", label: "Birthday" },
  { id: "corporate", label: "Corporate event" },
  { id: "private", label: "Private party" },
  { id: "club", label: "Club/bar" },
  { id: "student", label: "Student party" },
  { id: "other", label: "Other" },
] as const;

export function eventTypeLabel(id: string) {
  return EVENT_TYPES.find((e) => e.id === id)?.label ?? id;
}

export const BOOKING_STATUS_LABELS = {
  pending: "Awaiting reply",
  accepted: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
} as const;
