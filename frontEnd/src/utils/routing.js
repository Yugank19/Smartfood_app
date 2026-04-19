/**
 * Routing utility — uses multiple free routing APIs with fallback chain:
 * 1. OSRM demo server (free, no key)
 * 2. Straight-line fallback with Haversine
 */

export const getRoute = async (fromLat, fromLng, toLat, toLng) => {
    console.log('Routing from', fromLat, fromLng, 'to', toLat, toLng);

    // Validate coordinates
    if (!fromLat || !fromLng || !toLat || !toLng) {
        console.warn('Invalid coordinates for routing');
        return buildFallback(fromLat, fromLng, toLat, toLng);
    }

    // Try OSRM
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=false`;
        console.log('OSRM URL:', url);

        const res = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(8000)
        });

        if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
        const data = await res.json();
        console.log('OSRM response:', data.code, data.routes?.length);

        if (data.code === 'Ok' && data.routes?.length > 0) {
            const route = data.routes[0];
            const coords = route.geometry.coordinates.map(c => [c[1], c[0]]); // GeoJSON [lng,lat] → [lat,lng]
            console.log('OSRM route points:', coords.length);
            return {
                distance: (route.distance / 1000).toFixed(1),
                duration: Math.ceil(route.duration / 60),
                coordinates: coords,
                success: true,
                isStraightLine: false
            };
        }
    } catch (e) {
        console.warn('OSRM failed:', e.message);
    }

    // Fallback: straight line
    return buildFallback(fromLat, fromLng, toLat, toLng);
};

const buildFallback = (fromLat, fromLng, toLat, toLng) => {
    if (!fromLat || !toLat) return null;
    const dist = haversineDistance(fromLat, fromLng, toLat, toLng);
    // Build a few intermediate points for a smoother line
    const points = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        points.push([
            fromLat + (toLat - fromLat) * t,
            fromLng + (toLng - fromLng) * t
        ]);
    }
    return {
        distance: dist.toFixed(1),
        duration: Math.ceil((dist / 25) * 60),
        coordinates: points,
        success: false,
        isStraightLine: true
    };
};

export const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDuration = (minutes) => {
    if (!minutes) return '—';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};
