// Test script for the flight normalizer
const testData = {
  "summary": {
    "callsign": "JBU1728",
    "fr24_id": "3bc50671",
    "status": "ENROUTE"
  },
  "lastPosition": {
    "fr24_id": "3bc50671",
    "hex": "A65104",
    "callsign": "JBU1728",
    "lat": 32.8222,
    "lon": -80.56192,
    "track": 26,
    "alt": 36750,
    "gspeed": 473,
    "vspeed": 512,
    "squawk": "2656",
    "timestamp": "2025-08-16T23:19:03Z",
    "source": "ADSB"
  },
  "fr24": {
    "data": [{
      "fr24_id": "3bc50671",
      "hex": "A65104",
      "callsign": "JBU1728",
      "lat": 32.8222,
      "lon": -80.56192,
      "track": 26,
      "alt": 36750,
      "gspeed": 473,
      "vspeed": 512,
      "squawk": "2656",
      "timestamp": "2025-08-16T23:19:03Z",
      "source": "ADSB"
    }]
  },
  "progressPercent": null,
  "success": true,
  "meta": {
    "cache": "MISS",
    "ageMs": 0
  }
};

// Test the normalizer functions
console.log("Testing flight normalizer...");
console.log("Raw data:", JSON.stringify(testData, null, 2));

// Import the normalizer (this would work in the browser)
// For now, let's test the logic manually
const s = testData.summary ?? {};
const p = testData.lastPosition ?? testData.fr24?.data?.[0] ?? {};

const normalized = {
  callsign: s.callsign ?? null,
  status: s.status ?? null,
  fr24Id: s.fr24_id ?? null,
  lat: p.lat ?? null,
  lon: p.lon ?? null,
  altFt: p.alt ?? null,
  gndKt: p.gspeed ?? null,
  vsFpm: typeof p.vspeed === 'number' ? p.vspeed : null,
  trackDeg: p.track ?? null,
  source: p.source ?? null,
  updatedIso: p.timestamp ?? null,
  progressPercent: testData.progressPercent ?? null,
};

console.log("Normalized data:", normalized);

// Test formatting functions
const asFlightLevel = (altFt) => typeof altFt === 'number' ? `FL${Math.round(altFt / 100)}` : 'N/A';
const fmt = {
  coord: (n) => (typeof n === 'number' ? n.toFixed(5) : 'N/A'),
  kt: (n) => (typeof n === 'number' ? `${n} kt` : 'N/A'),
  fpm: (n) => typeof n === 'number' ? `${n >= 0 ? '+' : ''}${n} ft/min` : 'N/A',
  deg: (n) => (typeof n === 'number' ? `${n}°` : 'N/A'),
  isoAgo: (iso) => {
    if (!iso) return 'N/A';
    const d = new Date(iso).getTime();
    if (Number.isNaN(d)) return iso;
    const m = Math.max(0, Math.round((Date.now() - d) / 60000));
    return m === 0 ? 'just now' : `${m} min ago`;
  },
};

console.log("Formatted values:");
console.log("Altitude:", asFlightLevel(normalized.altFt));
console.log("Coordinates:", fmt.coord(normalized.lat), fmt.coord(normalized.lon));
console.log("Ground Speed:", fmt.kt(normalized.gndKt));
console.log("Vertical Speed:", fmt.fpm(normalized.vsFpm));
console.log("Track:", fmt.deg(normalized.trackDeg));
console.log("Last Update:", fmt.isoAgo(normalized.updatedIso));
console.log("Source:", normalized.source);
