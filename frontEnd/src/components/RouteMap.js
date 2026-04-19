import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getRoute, formatDuration } from '../utils/routing';

// ── Icons ─────────────────────────────────────────────────────────────────────

const donorIcon = L.divIcon({
    html: `<div style="
        background:linear-gradient(135deg,#003527,#064e3b);
        color:white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        width:40px;height:40px;border:3px solid white;
        box-shadow:0 4px 20px rgba(0,53,39,0.5);
        display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);font-size:18px">🍽</span>
    </div>`,
    className: '', iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -44]
});

const userIcon = L.divIcon({
    html: `<div style="
        background:#1A73E8;color:white;border-radius:50%;
        width:36px;height:36px;border:4px solid white;
        box-shadow:0 4px 16px rgba(26,115,232,0.6);
        display:flex;align-items:center;justify-content:center;font-size:16px;">
        📍
    </div>`,
    className: '', iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -22]
});

// Component that fits map bounds to show the full route
const FitRoute = ({ points }) => {
    const map = useMap();
    const fitted = useRef(false);

    useEffect(() => {
        // Always invalidate size first to fix blank tile issue
        map.invalidateSize();

        if (points.length >= 2 && !fitted.current) {
            setTimeout(() => {
                try {
                    const bounds = L.latLngBounds(points);
                    if (bounds.isValid()) {
                        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15, animate: true });
                        fitted.current = true;
                    }
                } catch (e) {}
            }, 200);
        }
    }, [points, map]);

    return null;
};

// Distance label in the middle of the route
const RouteLabel = ({ points, distance, duration }) => {
    const map = useMap();

    useEffect(() => {
        if (points.length < 2 || !distance) return;

        // Place label at midpoint of route
        const mid = points[Math.floor(points.length / 2)];
        const label = L.divIcon({
            html: `<div style="
                background:white;border:2px solid #1A73E8;border-radius:20px;
                padding:4px 10px;font-size:12px;font-weight:800;color:#1A73E8;
                white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2);
                font-family:Inter,sans-serif;">
                📏 ${distance} km · ⏱ ${formatDuration(duration)}
            </div>`,
            className: '',
            iconAnchor: [60, 14]
        });

        const marker = L.marker(mid, { icon: label, interactive: false, zIndexOffset: 500 });
        marker.addTo(map);
        return () => { try { map.removeLayer(marker); } catch (e) {} };
    }, [points, distance, duration, map]);

    return null;
};

/**
 * RouteMap — full-screen modal showing route from user to donor.
 */
const RouteMap = ({ donorLat, donorLng, donorName, foodType, onClose }) => {
    const [userLocation, setUserLocation] = useState(null);
    const [routeData, setRouteData] = useState(null);
    const [locationError, setLocationError] = useState('');
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [satellite, setSatellite] = useState(false); // street by default so route is more visible

    const getUserLocation = useCallback(() => {
        setLoadingLocation(true);
        setLocationError('');
        if (!navigator.geolocation) {
            setLocationError('Geolocation not supported.');
            setLoadingLocation(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLoadingLocation(false);
            },
            () => {
                setLocationError('Could not get your location. Please allow location access and retry.');
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    useEffect(() => { getUserLocation(); }, [getUserLocation]);

    useEffect(() => {
        if (!userLocation || !donorLat || !donorLng) return;
        setLoadingRoute(true);
        setRouteData(null);
        getRoute(userLocation.lat, userLocation.lng, donorLat, donorLng).then(data => {
            console.log('Route data received:', data);
            setRouteData(data);
            setLoadingRoute(false);
        });
    }, [userLocation, donorLat, donorLng]);

    const routePoints = routeData?.coordinates || [];

    // All points for fitting bounds
    const allPoints = [
        ...(userLocation ? [[userLocation.lat, userLocation.lng]] : []),
        [donorLat, donorLng],
        ...routePoints
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                background: 'white', borderRadius: '20px',
                width: '100%', maxWidth: '860px', maxHeight: '92vh',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 32px 100px rgba(0,0,0,0.35)'
            }}>
                {/* Header */}
                <div style={{ padding: '14px 20px', background: '#003527', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Route to Donor</p>
                        <h3 style={{ margin: '2px 0 0', fontFamily: 'Manrope,sans-serif', fontSize: '1.1rem', fontWeight: 800 }}>
                            {donorName} — {foodType}
                        </h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>
                        ✕ Close
                    </button>
                </div>

                {/* Route Info Bar */}
                {routeData && (
                    <div style={{ padding: '10px 20px', background: '#EBF5FB', borderBottom: '1px solid #BEE3F8', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ background: '#1A73E8', borderRadius: '8px', padding: '6px 10px', color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>
                                {routeData.distance} km
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.65rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' }}>Distance</p>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#003527', fontWeight: 700 }}>
                                    {routeData.isStraightLine ? 'Straight line' : 'By road'}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ background: '#003527', borderRadius: '8px', padding: '6px 10px', color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>
                                {formatDuration(routeData.duration)}
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.65rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' }}>Est. Travel Time</p>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#003527', fontWeight: 700 }}>By car</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${donorLat},${donorLng}&travelmode=driving`, '_blank')}
                            style={{ marginLeft: 'auto', background: '#1A73E8', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 16px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                            🗺 Open in Google Maps
                        </button>
                    </div>
                )}

                {/* Status banners */}
                {loadingLocation && (
                    <div style={{ padding: '10px 20px', background: '#FEF3C7', color: '#92400E', fontSize: '0.875rem', fontWeight: 600 }}>
                        ⏳ Getting your location...
                    </div>
                )}
                {locationError && (
                    <div style={{ padding: '10px 20px', background: '#FEE2E2', color: '#DC2626', fontSize: '0.875rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>⚠ {locationError}</span>
                        <button onClick={getUserLocation} style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Retry</button>
                    </div>
                )}
                {loadingRoute && (
                    <div style={{ padding: '8px 20px', background: '#EBF5FB', color: '#1A73E8', fontSize: '0.875rem', fontWeight: 600 }}>
                        ⏳ Calculating shortest road route...
                    </div>
                )}

                {/* Map */}
                <div style={{ flex: 1, minHeight: '420px', height: '420px', position: 'relative', background: '#e8f4f8' }}>
                    {/* Layer toggle */}
                    <button
                        onClick={() => setSatellite(s => !s)}
                        style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000, background: 'white', border: '2px solid #ccc', borderRadius: '8px', padding: '6px 12px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', color: '#003527' }}
                    >
                        {satellite ? '🗺 Street' : '🛰 Satellite'}
                    </button>

                    <MapContainer
                        center={[donorLat, donorLng]}
                        zoom={13}
                        style={{ height: '420px', width: '100%' }}
                        scrollWheelZoom={true}
                        whenReady={(map) => {
                            // Force tile refresh after mount
                            setTimeout(() => map.target.invalidateSize(), 100);
                        }}
                    >
                        {satellite ? (
                            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri" maxZoom={19} />
                        ) : (
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' maxZoom={19} />
                        )}

                        {/* Fit map to show full route */}
                        {allPoints.length >= 2 && <FitRoute points={allPoints} />}

                        {/* ── ROUTE LINE — Google Maps style blue ── */}
                        {routePoints.length >= 2 && (
                            <>
                                {/* Shadow/border underneath */}
                                <Polyline
                                    positions={routePoints}
                                    pathOptions={{ color: 'white', weight: 12, opacity: 0.8 }}
                                />
                                {/* Main blue route */}
                                <Polyline
                                    positions={routePoints}
                                    pathOptions={{
                                        color: routeData?.isStraightLine ? '#F59E0B' : '#1A73E8',
                                        weight: 7,
                                        opacity: 1,
                                        dashArray: routeData?.isStraightLine ? '14, 10' : undefined,
                                        lineCap: 'round',
                                        lineJoin: 'round'
                                    }}
                                />
                            </>
                        )}

                        {/* Distance label on route */}
                        {routePoints.length >= 2 && routeData && (
                            <RouteLabel
                                points={routePoints}
                                distance={routeData.distance}
                                duration={routeData.duration}
                            />
                        )}

                        {/* Donor marker */}
                        <Marker position={[donorLat, donorLng]} icon={donorIcon}>
                            <Popup>
                                <div style={{ fontFamily: 'Inter,sans-serif', minWidth: '150px' }}>
                                    <p style={{ fontWeight: 800, color: '#003527', margin: '0 0 4px' }}>🍽 {foodType}</p>
                                    <p style={{ fontWeight: 600, color: '#416900', margin: '0 0 4px', fontSize: '0.85rem' }}>👤 {donorName}</p>
                                    {routeData && <p style={{ margin: 0, fontSize: '0.8rem', color: '#1A73E8', fontWeight: 700 }}>📏 {routeData.distance} km · ⏱ {formatDuration(routeData.duration)}</p>}
                                </div>
                            </Popup>
                        </Marker>

                        {/* User location marker */}
                        {userLocation && (
                            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                                <Popup>
                                    <p style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, color: '#1A73E8', margin: 0 }}>📍 Your Location</p>
                                </Popup>
                            </Marker>
                        )}
                    </MapContainer>
                </div>

                {/* Legend */}
                <div style={{ padding: '8px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', background: '#F9FAFB', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: 24, height: 4, background: '#1A73E8', borderRadius: 2, display: 'inline-block' }}></span>
                        Shortest road route
                    </span>
                    <span>🔵 Your location</span>
                    <span>🍽 Donor location</span>
                    {routeData?.isStraightLine && <span style={{ color: '#F59E0B' }}>⚠ Straight-line estimate (road routing unavailable)</span>}
                </div>
            </div>
        </div>
    );
};

export default RouteMap;
