const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "AlyahPharmaNet/1.0 (pharmacy location picker)";

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export const searchNominatim = async (
  query: string,
  limit = 5,
): Promise<NominatimResult[]> => {
  if (!query.trim() || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    q: query.trim(),
    format: "json",
    addressdetails: "0",
    limit: String(limit),
    countrycodes: "et",
  });

  const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });

  if (!response.ok) return [];
  const data = (await response.json()) as NominatimResult[];
  return Array.isArray(data) ? data : [];
};

export const reverseNominatim = async (
  lat: number,
  lng: number,
): Promise<string | null> => {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
  });

  const response = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { display_name?: string };
  return data.display_name ?? null;
};
