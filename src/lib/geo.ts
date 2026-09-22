export type City = { name: string; lat: number; lng: number };

export const CITIES: City[] = [
  { name: "Stockholm", lat: 59.3293, lng: 18.0686 },
  { name: "Göteborg", lat: 57.7089, lng: 11.9746 },
  { name: "Malmö", lat: 55.605, lng: 13.0038 },
  { name: "Uppsala", lat: 59.8586, lng: 17.6389 },
  { name: "Västerås", lat: 59.6099, lng: 16.5448 },
  { name: "Örebro", lat: 59.2753, lng: 15.2134 },
  { name: "Linköping", lat: 58.4108, lng: 15.6214 },
  { name: "Helsingborg", lat: 56.0465, lng: 12.6945 },
  { name: "Jönköping", lat: 57.7826, lng: 14.1618 },
  { name: "Norrköping", lat: 58.5877, lng: 16.1924 },
  { name: "Lund", lat: 55.7047, lng: 13.191 },
  { name: "Umeå", lat: 63.8258, lng: 20.263 },
  { name: "Gävle", lat: 60.6749, lng: 17.1413 },
  { name: "Borås", lat: 57.721, lng: 12.9401 },
  { name: "Södertälje", lat: 59.1955, lng: 17.6253 },
  { name: "Eskilstuna", lat: 59.3666, lng: 16.5077 },
  { name: "Halmstad", lat: 56.6745, lng: 12.8578 },
  { name: "Växjö", lat: 56.8777, lng: 14.8091 },
  { name: "Karlstad", lat: 59.4022, lng: 13.5115 },
  { name: "Sundsvall", lat: 62.3908, lng: 17.3069 },
  { name: "Luleå", lat: 65.5848, lng: 22.1547 },
  { name: "Östersund", lat: 63.1792, lng: 14.6357 },
  { name: "Kalmar", lat: 56.6634, lng: 16.3568 },
  { name: "Kristianstad", lat: 56.0294, lng: 14.1567 },
  { name: "Visby", lat: 57.6348, lng: 18.2948 },
  { name: "Falun", lat: 60.6065, lng: 15.6355 },
  { name: "Skövde", lat: 58.3903, lng: 13.8461 },
  { name: "Trollhättan", lat: 58.2837, lng: 12.2886 },
  { name: "Nyköping", lat: 58.753, lng: 17.0079 },
];

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function findCity(name: string | undefined | null): City | undefined {
  if (!name) return undefined;
  const needle = normalize(name);
  if (!needle) return undefined;
  return CITIES.find((c) => normalize(c.name) === needle);
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in kilometres (haversine). */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
