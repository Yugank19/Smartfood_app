/**
 * Geocodes addresses using OpenStreetMap Nominatim.
 * Free, no API key. Caches results in memory.
 */
const cache = {};

export const geocodeAddress = async (address) => {
    if (!address?.trim()) return null;
    const key = address.trim().toLowerCase();
    if (cache[key]) return cache[key];

    try {
        const q = encodeURIComponent(address);
        const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&addressdetails=0`;
        const res = await fetch(url, {
            headers: {
                'Accept-Language': 'en',
                'User-Agent': 'MealBridge-FoodRedistribution/1.0'
            }
        });
        const data = await res.json();
        if (data?.length > 0) {
            const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            cache[key] = coords;
            return coords;
        }
    } catch (e) {
        // Silently fail — map will show without this marker
    }
    return null;
};

/**
 * Enriches listings with lat/lng.
 * - Listings that already have coords: skipped instantly
 * - Listings without coords: geocoded in parallel batches of 3
 *   (Nominatim allows ~1 req/sec; batching with small delay)
 */
export const enrichListingsWithCoords = async (listings) => {
    if (!listings?.length) return [];

    const needsGeocode = listings.filter(l => !l.latitude || !l.longitude);
    const hasCoords = listings.filter(l => l.latitude && l.longitude);

    if (needsGeocode.length === 0) return listings;

    // Geocode in batches of 3 with 1.2s between batches
    const geocoded = [...hasCoords];
    const batchSize = 3;

    for (let i = 0; i < needsGeocode.length; i += batchSize) {
        const batch = needsGeocode.slice(i, i + batchSize);
        const results = await Promise.all(
            batch.map(async (listing) => {
                const coords = await geocodeAddress(listing.location);
                if (coords) {
                    return { ...listing, latitude: coords.lat, longitude: coords.lng };
                }
                return listing;
            })
        );
        geocoded.push(...results);
        if (i + batchSize < needsGeocode.length) {
            await new Promise(r => setTimeout(r, 1200));
        }
    }

    // Restore original order
    return listings.map(orig => {
        const enriched = geocoded.find(e => e.id === orig.id);
        return enriched || orig;
    });
};
