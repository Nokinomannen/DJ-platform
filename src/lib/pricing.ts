/** Share of the booking subtotal the booker pays as platform fee. */
export const SERVICE_FEE_RATE = 0.08;

export const MIN_BOOKING_HOURS = 1;
export const MAX_BOOKING_HOURS = 12;

export type PricedAddon = {
  id: string;
  name: string;
  price: number;
  priceType: "fixed" | "per_hour";
};

export type Quote = {
  billableHours: number;
  performance: number;
  addonLines: { id: string; name: string; amount: number }[];
  addonsTotal: number;
  subtotal: number;
  serviceFee: number;
  total: number;
};

/** All amounts are whole SEK. */
export function quote(
  artist: { hourlyRate: number; minHours: number },
  hours: number,
  addons: PricedAddon[],
): Quote {
  const billableHours = Math.max(hours, artist.minHours);
  const performance = artist.hourlyRate * billableHours;
  const addonLines = addons.map((a) => ({
    id: a.id,
    name: a.name,
    amount: a.priceType === "per_hour" ? a.price * billableHours : a.price,
  }));
  const addonsTotal = addonLines.reduce((sum, line) => sum + line.amount, 0);
  const subtotal = performance + addonsTotal;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  return {
    billableHours,
    performance,
    addonLines,
    addonsTotal,
    subtotal,
    serviceFee,
    total: subtotal + serviceFee,
  };
}
