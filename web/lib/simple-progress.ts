export type SimpleProgressResponse = {
  origin: { code: string; lat: number; lon: number };
  destination: { code: string; lat: number; lon: number };
  currentPosition: { lat: number; lon: number };
  progress: { pct: number; totalKm: number; coveredKm: number; remainingKm: number };
};

export async function fetchSimpleProgress(
  origin: string,
  dest: string,
  lat: number,
  lon: number
): Promise<SimpleProgressResponse | null> {
  try {
    const url = `/api/flight-progress?origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(
      dest
    )}&lat=${lat}&lon=${lon}`;
    console.log('Making API call to:', url);
    const response = await fetch(url);
    console.log('API response status:', response.status);
    if (!response.ok) {
      console.error('API call failed:', response.status);
      return null;
    }
    const data = await response.json();
    console.log('API response data:', data);
    return data as SimpleProgressResponse;
  } catch (error) {
    console.error('Error in fetchSimpleProgress:', error);
    return null;
  }
}
