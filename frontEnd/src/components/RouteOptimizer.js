import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Feature 8: Route Optimization — Multi-Pickup Route for Volunteers
 * Shows optimized ordered stops on a map with distance and ETA per stop.
 */

const stopIcon = (num) => L.divIcon({
    html: `<div style="background:#003527;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${num}</div>`,
    className: '', iconSize: [30, 30], iconAnchor: [15, 15]
});

const userIcon = L.divIcon({
    html: `<div style="background:#1A73E8;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(26,115,232,0.5)">📍</div>`,
    className: '', iconSize: [32, 32], iconAnchor: [16, 16]
});

const FitAll = ({ points }) => {
    const map = useMap();
    useEffect(() => {
        if (points.length >= 2) {
            map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 14 });
        }
    }, [points, map]);
    return null;
};

const RouteOptimizer = ({ token, onClose }) => {
    const [route, setRoute] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userCoords, setUserCoords] = useState(null);
    const [error, setError] = useState('');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    const fetchRoute = (lat, lng) => {
        setLoading(true);
        setError('');
        axios.get(`${API_BASE_URL}/api/pickups/my-optimized-route?lat=${lat}&lng=${lng}`, authHeader)
            .then(res => { setRoute(res.data); setLoading(false); })
            .catch(err => { setError('Could not load route.'); setLoading(false); });
    };

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserCoords(coords);
                    fetchRoute(coords.lat, coords.lng);
                },
                () => setError('Location access denied. Cannot optimize route.')
            );
        }
    }, []);

    const allPoints = [
        ...(userCoords ? [[userCoords.lat, userCoords.lng]] : []),
        ...route.map(s => [s.latitude, s.longitude]).filter(p => p[0] && p[1])
    ];

    const totalDist = route.length > 0 ? route.reduce((sum, s) => sum + (s.distanceFromPrevKm || 0), 0).toFixed(1) : 0;
    const totalTime = route.length > 0 ? route.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0) : 0;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 100px rgba(0,0,0,0.3)' }}>
                {/* Header */}
                <div style={{ padding: '14px 20px', background: '#003527', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase' }}>Multi-Pickup</p>
                        <h3 style={{ margin: '2px 0 0', fontFamily: 'Manrope,sans-serif', fontSize: '1.1rem', fontWeight: 800 }}>🗺 Optimized Route</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>✕ Close</button>
                </div>

                {/* Summary bar */}
                {route.length > 0 && (
                    <div style={{ padding: '10px 20px', background: '#F0FDF4', borderBottom: '1px solid #BBF7D0', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        <div><span style={{ fontWeight: 800, color: '#003527', fontSize: '1.1rem' }}>{route.length}</span> <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>stops</span></div>
                        <div><span style={{ fontWeight: 800, color: '#1A73E8', fontSize: '1.1rem' }}>{totalDist} km</span> <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>total</span></div>
                        <div><span style={{ fontWeight: 800, color: '#416900', fontSize: '1.1rem' }}>{totalTime} min</span> <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>estimated</span></div>
                    </div>
                )}

                {error && <div style={{ padding: '12px 20px', background: '#FEE2E2', color: '#DC2626', fontWeight: 600, fontSize: '0.875rem' }}>⚠ {error}</div>}
                {loading && <div style={{ padding: '12px 20px', background: '#EBF5FB', color: '#1A73E8', fontWeight: 600, fontSize: '0.875rem' }}>⏳ Calculating optimized route...</div>}

                <div style={{ display: 'flex', flex: 1, minHeight: '400px', overflow: 'hidden' }}>
                    {/* Stop list */}
                    <div style={{ width: '280px', overflowY: 'auto', borderRight: '1px solid #E5E7EB', padding: '12px' }}>
                        {route.length === 0 && !loading && (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
                                <p style={{ fontWeight: 600 }}>No pending pickups nearby</p>
                            </div>
                        )}
                        {route.map((stop, i) => (
                            <div key={i} style={{ padding: '10px', borderRadius: '10px', marginBottom: '8px', background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#003527', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>{stop.stopNumber}</div>
                                    <p style={{ fontWeight: 700, fontSize: '0.875rem', margin: 0, color: '#003527' }}>{stop.foodType}</p>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0 0 2px' }}>📍 {stop.location?.split(',').slice(0, 2).join(',')}</p>
                                <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0 0 4px' }}>🤝 {stop.ngoName}</p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1A73E8' }}>+{stop.distanceFromPrevKm} km</span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#416900' }}>~{stop.estimatedMinutes} min</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Map */}
                    <div style={{ flex: 1 }}>
                        <MapContainer center={userCoords ? [userCoords.lat, userCoords.lng] : [20.5937, 78.9629]} zoom={12} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                            {allPoints.length >= 2 && <FitAll points={allPoints} />}

                            {/* Route line */}
                            {allPoints.length >= 2 && (
                                <>
                                    <Polyline positions={allPoints} pathOptions={{ color: 'white', weight: 10, opacity: 0.8 }} />
                                    <Polyline positions={allPoints} pathOptions={{ color: '#1A73E8', weight: 5, opacity: 1 }} />
                                </>
                            )}

                            {/* User location */}
                            {userCoords && (
                                <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
                                    <Popup><strong>Your Location</strong></Popup>
                                </Marker>
                            )}

                            {/* Stop markers */}
                            {route.map((stop, i) => stop.latitude && stop.longitude && (
                                <Marker key={i} position={[stop.latitude, stop.longitude]} icon={stopIcon(stop.stopNumber)}>
                                    <Popup>
                                        <div style={{ fontFamily: 'Inter,sans-serif', minWidth: '160px' }}>
                                            <p style={{ fontWeight: 800, color: '#003527', margin: '0 0 4px' }}>Stop {stop.stopNumber}: {stop.foodType}</p>
                                            <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0 0 2px' }}>{stop.quantity}</p>
                                            <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0 0 4px' }}>For: {stop.ngoName}</p>
                                            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1A73E8', margin: 0 }}>+{stop.distanceFromPrevKm} km · ~{stop.estimatedMinutes} min</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RouteOptimizer;
