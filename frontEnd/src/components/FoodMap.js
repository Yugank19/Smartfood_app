import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons — use local leaflet package (not CDN)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// ── Custom SVG markers ────────────────────────────────────────────────────────

const createSvgIcon = (color, pulse = false) => {
    const pulseCircle = pulse
        ? `<circle cx="20" cy="20" r="18" fill="${color}" opacity="0.2">
            <animate attributeName="r" values="14;24;14" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.25;0;0.25" dur="1.5s" repeatCount="indefinite"/>
           </circle>`
        : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 56" width="40" height="56">
        ${pulseCircle}
        <path d="M20 0C9 0 0 9 0 20c0 15 20 36 20 36s20-21 20-36C40 9 31 0 20 0z"
              fill="${color}" stroke="white" stroke-width="2.5"/>
        <circle cx="20" cy="20" r="9" fill="white" opacity="0.95"/>
        <text x="20" y="25" text-anchor="middle" font-size="11" fill="${color}" font-weight="bold">🍽</text>
    </svg>`;
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [40, 56],
        iconAnchor: [20, 56],
        popupAnchor: [0, -58],
    });
};

const normalIcon  = createSvgIcon('#416900');
const warningIcon = createSvgIcon('#F59E0B');
const urgentIcon  = createSvgIcon('#DC2626', true);

const getUrgency = (expiryTime) => {
    const mins = (new Date(expiryTime) - new Date()) / 60000;
    if (mins <= 15) return 'critical';
    if (mins <= 60) return 'warning';
    return 'normal';
};

const getIcon = (expiryTime) => {
    const u = getUrgency(expiryTime);
    if (u === 'critical') return urgentIcon;
    if (u === 'warning')  return warningIcon;
    return normalIcon;
};

// Auto-fit map to all markers
const FitBounds = ({ listings }) => {
    const map = useMap();
    useEffect(() => {
        const valid = listings.filter(l => l.latitude && l.longitude);
        if (valid.length > 0) {
            const bounds = L.latLngBounds(valid.map(l => [l.latitude, l.longitude]));
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
        }
    }, [listings, map]);
    return null;
};

// Tile layer switcher (no LayersControl — avoids v5 API issues)
const SatelliteLayer = () => (
    <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
        maxZoom={19}
    />
);

const StreetLayer = () => (
    <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
    />
);

/**
 * FoodMap — satellite/street map with urgency markers.
 *
 * Props:
 *   listings       — FoodListing[] with latitude & longitude
 *   onClaim        — (id) => void
 *   onGetRoute     — (listing) => void  ← NEW
 *   defaultSatellite — boolean (default true)
 *   center         — [lat, lng] fallback center
 */
const FoodMap = ({
    listings = [],
    onClaim,
    onGetRoute,
    defaultSatellite = true,
    center = [20.5937, 78.9629],
}) => {
    const [satellite, setSatellite] = useState(defaultSatellite);
    const mappable = listings.filter(l => l.latitude && l.longitude);
    const initialCenter = mappable.length > 0
        ? [mappable[0].latitude, mappable[0].longitude]
        : center;

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            {/* Layer toggle button */}
            <button
                onClick={() => setSatellite(s => !s)}
                style={{
                    position: 'absolute', top: '10px', left: '10px', zIndex: 1000,
                    background: 'white', border: '2px solid #ccc', borderRadius: '8px',
                    padding: '6px 12px', fontWeight: 700, fontSize: '0.75rem',
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    color: '#003527'
                }}
            >
                {satellite ? '🗺 Street' : '🛰 Satellite'}
            </button>

            <MapContainer
                center={initialCenter}
                zoom={mappable.length > 0 ? 14 : 5}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                {satellite ? <SatelliteLayer /> : <StreetLayer />}
                <FitBounds listings={mappable} />

                {mappable.map(listing => {
                    const urgency = getUrgency(listing.expiryTime);
                    const minsLeft = Math.max(0, Math.floor((new Date(listing.expiryTime) - new Date()) / 60000));
                    const urgencyColor = urgency === 'critical' ? '#DC2626' : urgency === 'warning' ? '#F59E0B' : '#416900';

                    return (
                        <Marker
                            key={listing.id}
                            position={[listing.latitude, listing.longitude]}
                            icon={getIcon(listing.expiryTime)}
                        >
                            <Popup maxWidth={260} minWidth={220}>
                                <div style={{ fontFamily: 'Inter, sans-serif', padding: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <div>
                                            <p style={{ fontWeight: 800, fontSize: '1rem', color: '#003527', margin: 0 }}>
                                                {listing.foodType}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: '#416900', fontWeight: 700, margin: '2px 0 0' }}>
                                                👤 {listing.donor?.fullName || 'Donor'}
                                            </p>
                                        </div>
                                        <span style={{
                                            background: urgencyColor + '22', color: urgencyColor,
                                            fontSize: '0.65rem', fontWeight: 800,
                                            padding: '3px 8px', borderRadius: '100px', whiteSpace: 'nowrap'
                                        }}>
                                            {urgency === 'critical' ? '⚠ URGENT' : urgency === 'warning' ? '⏱ SOON' : '✓ FRESH'}
                                        </span>
                                    </div>

                                    <div style={{ background: '#f8f9ff', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#707974' }}>Quantity</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#003527' }}>{listing.quantity}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#707974' }}>Location</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#003527', maxWidth: '130px', textAlign: 'right' }}>{listing.location}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#707974' }}>Expires in</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: urgencyColor }}>
                                                {minsLeft < 60 ? `${minsLeft} min` : `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m`}
                                            </span>
                                        </div>
                                    </div>

                                    <p style={{ fontSize: '0.65rem', color: '#9CA3AF', marginBottom: '10px', textAlign: 'center' }}>
                                        📍 {listing.latitude?.toFixed(5)}, {listing.longitude?.toFixed(5)}
                                    </p>

                                    {onClaim && (
                                        <button
                                            onClick={() => onClaim(listing.id)}
                                            style={{
                                                width: '100%',
                                                background: 'linear-gradient(135deg, #003527 0%, #064e3b 100%)',
                                                color: 'white', border: 'none', borderRadius: '8px',
                                                padding: '10px', fontWeight: 800, fontSize: '0.85rem',
                                                cursor: 'pointer', letterSpacing: '0.02em',
                                                marginBottom: onGetRoute ? '6px' : '0'
                                            }}
                                        >
                                            Claim This Donation →
                                        </button>
                                    )}
                                    {onGetRoute && (
                                        <button
                                            onClick={() => onGetRoute(listing)}
                                            style={{
                                                width: '100%',
                                                background: '#F0FDF4',
                                                color: '#003527', border: '2px solid #003527', borderRadius: '8px',
                                                padding: '8px', fontWeight: 800, fontSize: '0.8rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🧭 Get Route & ETA
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {mappable.length === 0 && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(255,255,255,0.92)', borderRadius: '16px',
                        padding: '24px 32px', textAlign: 'center', zIndex: 1000,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📍</div>
                        <p style={{ fontWeight: 700, color: '#003527', margin: 0 }}>No mapped listings yet</p>
                        <p style={{ fontSize: '0.8rem', color: '#707974', marginTop: '4px' }}>
                            Donors need to set their address in profile
                        </p>
                    </div>
                )}
            </MapContainer>
        </div>
    );
};

export default FoodMap;
