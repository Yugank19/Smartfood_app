import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FoodMap from '../components/FoodMap';
import RouteMap from '../components/RouteMap';
import ChatBox from '../components/ChatBox';
import { geocodeAddress } from '../utils/geocode';
import useWebSocket from '../hooks/useWebSocket';

const getExpiryUrgency = (expiryTime) => {
    const mins = (new Date(expiryTime) - new Date()) / 60000;
    if (mins <= 15) return 'critical';
    if (mins <= 60) return 'warning';
    return 'normal';
};

const RADIUS_OPTIONS = [5, 10, 15, 20, 25];

const NGOFeed = () => {
    const [availableListings, setAvailableListings] = useState([]);
    const [mappableListings, setMappableListings] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedImageSet, setSelectedImageSet] = useState(null); // For viewing multiple images in a modal
    const [selectedDetailListing, setSelectedDetailListing] = useState(null); // For full details modal
    const [geocodingStatus, setGeocodingStatus] = useState('');
    const [activeView, setActiveView] = useState('list');
    const [routeTarget, setRouteTarget] = useState(null);
    const [chatPickupId, setChatPickupId] = useState(null); // Feature 4: Chat
    const [userCoords, setUserCoords] = useState({ lat: null, lng: null });
    const [selectedRadius, setSelectedRadius] = useState(null);
    // Only show radius modal if no radius was previously selected this session
    const [showRadiusModal, setShowRadiusModal] = useState(false);
    const navigate = useNavigate();

    const token = sessionStorage.getItem('token');
    const phone = sessionStorage.getItem('phone');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // Geocode all listings that are missing coordinates
    const geocodeListings = useCallback(async (listings) => {
        if (!listings.length) return listings;

        const needsGeocode = listings.filter(l => !l.latitude || !l.longitude);
        if (needsGeocode.length === 0) return listings;

        setGeocodingStatus('loading');
        const enriched = [...listings];

        for (let i = 0; i < enriched.length; i++) {
            if (!enriched[i].latitude || !enriched[i].longitude) {
                const addr = enriched[i].location;
                if (addr) {
                    const coords = await geocodeAddress(addr);
                    if (coords) {
                        enriched[i] = { ...enriched[i], latitude: coords.lat, longitude: coords.lng };
                    }
                }
                // Small delay to respect Nominatim rate limit
                if (i < enriched.length - 1) {
                    await new Promise(r => setTimeout(r, 1100));
                }
            }
        }

        setGeocodingStatus('done');
        return enriched;
    }, []);

    const fetchData = useCallback(async (userLat, userLng, radius) => {
        try {
            let nearbyUrl = `${API_BASE_URL}/api/food/nearby`;
            if (userLat && userLng && radius) {
                nearbyUrl += `?lat=${userLat}&lng=${userLng}&radius=${radius}`;
            }

            const [listingsRes, requestsRes] = await Promise.all([
                axios.get(nearbyUrl, authHeader),
                axios.get(`${API_BASE_URL}/api/pickups/my-requests`, authHeader)
            ]);
            const raw = listingsRes.data;
            // Immediate frontend filter for expiry to ensure "disappear" requirement
            const now = new Date();
            const filtered = raw.filter(l => new Date(l.expiryTime) > now);
            
            setAvailableListings(filtered);
            setMyRequests(requestsRes.data);
            setMappableListings(filtered);

            const withoutCoords = raw.filter(l => !l.latitude || !l.longitude);
            if (withoutCoords.length > 0) {
                geocodeListings(raw).then(enriched => setMappableListings(enriched));
            }
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                sessionStorage.clear(); navigate('/login');
            }
        } finally { setLoading(false); }
    }, [token, geocodeListings, navigate]);

    // On mount: get GPS then show radius selector modal (only if not already set this session)
    useEffect(() => {
        const savedRadius = sessionStorage.getItem('ngo_radius');
        if (savedRadius) {
            // Radius already chosen this session — skip modal
            const r = parseInt(savedRadius, 10);
            setSelectedRadius(r);
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        setUserCoords(coords);
                        fetchData(coords.lat, coords.lng, r);
                    },
                    () => fetchData(null, null, r),
                    { enableHighAccuracy: true, timeout: 8000 }
                );
            } else {
                fetchData(null, null, r);
            }
            return;
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserCoords(coords);
                    setShowRadiusModal(true);
                },
                () => {
                    setShowRadiusModal(true);
                    fetchData(null, null, null);
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        } else {
            setShowRadiusModal(true);
            fetchData(null, null, null);
        }
    }, []); // only on mount

    // Re-fetch when radius changes
    useEffect(() => {
        if (selectedRadius !== null) {
            fetchData(userCoords.lat, userCoords.lng, selectedRadius);
            const t = setInterval(() => fetchData(userCoords.lat, userCoords.lng, selectedRadius), 30000);
            return () => clearInterval(t);
        }
    }, [selectedRadius, fetchData]);

    const handleRadiusSelect = (km) => {
        setSelectedRadius(km);
        sessionStorage.setItem('ngo_radius', km.toString()); // persist for this session
        setShowRadiusModal(false);
    };

    // WebSocket: listen for new listings
    useWebSocket(
        ['/topic/listings', phone ? `/topic/ngo/${phone}` : ''].filter(Boolean),
        useCallback((topic, data) => {
            if (data.type === 'NEW_LISTING') {
                setMessage(`🔔 New donation: ${data.foodType} (${data.quantity}) from ${data.donorName}`);
                setTimeout(() => setMessage(''), 8000);
                fetchData(userCoords.lat, userCoords.lng, selectedRadius);
            } else if (data.type === 'IMAGES_UPDATED') {
                // Instantly update the image for that listing in the state
                setAvailableListings(prev => prev.map(l => 
                    l.id === data.listingId ? { ...l, imageUrls: data.imageUrls } : l
                ));
            } else if (['VOLUNTEER_ASSIGNED', 'PICKED_UP', 'DELIVERED'].includes(data.type)) {
                fetchData(userCoords.lat, userCoords.lng, selectedRadius);
            }
        }, [fetchData, phone, userCoords, selectedRadius])
    );

    const handleClaim = async (id) => {
        try {
            await axios.patch(`${API_BASE_URL}/api/food/${id}/claim`, {}, authHeader);
            setMessage('✓ Donation claimed! A pickup request has been created.');
            setTimeout(() => setMessage(''), 5000);
            setActiveView('requests'); // Switch to requests view
            fetchData(userCoords.lat, userCoords.lng, selectedRadius);
        } catch (err) {
            setMessage('Error: ' + (err.response?.data?.message || 'Could not claim listing.'));
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const handleReject = async (pickupId) => {
        try {
            await axios.patch(`${API_BASE_URL}/api/pickups/${pickupId}/reject`, {}, authHeader);
            setMessage('Request rejected. The listing is now available for other NGOs.');
            setTimeout(() => setMessage(''), 5000);
            fetchData(userCoords.lat, userCoords.lng, selectedRadius);
        } catch (err) {
            setMessage('Error: ' + (err.response?.data?.message || 'Could not reject.'));
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const filtered = availableListings.filter(l =>
        (l.foodType?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (l.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const pendingRequests = myRequests.filter(r => r.status !== 'DELIVERED');
    const deliveredRequests = myRequests.filter(r => r.status === 'DELIVERED');
    const deliveredCount = deliveredRequests.length;
    const mappedCount = mappableListings.filter(l => l.latitude && l.longitude).length;

    const statusBadge = (s) => {
        const map = {
            PENDING: { bg: '#FEF3C7', color: '#92400E' },
            ASSIGNED: { bg: '#DBEAFE', color: '#1E40AF' },
            PICKED_UP: { bg: '#F3E8FF', color: '#6B21A8' },
            DELIVERED: { bg: '#b0f0d6', color: '#003527' }
        };
        return map[s] || { bg: '#E5E7EB', color: '#374151' };
    };

    return (
        <div className="flex min-h-screen bg-surface">
            {/* ── RADIUS SELECTOR MODAL ── */}
            {showRadiusModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9998,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '20px', padding: '2rem',
                        width: '100%', maxWidth: '420px',
                        boxShadow: '0 24px 80px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📍</div>
                            <h2 style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, color: '#003527', fontSize: '1.4rem', margin: '0 0 0.5rem' }}>
                                Select Search Radius
                            </h2>
                            <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
                                {userCoords.lat
                                    ? 'Choose how far to search for available food donations.'
                                    : 'Location not available. Select a radius to filter by your profile location.'}
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {RADIUS_OPTIONS.map(km => (
                                <button
                                    key={km}
                                    onClick={() => handleRadiusSelect(km)}
                                    style={{
                                        padding: '14px 20px',
                                        borderRadius: '12px',
                                        border: '2px solid #E5E7EB',
                                        background: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        color: '#003527',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.borderColor = '#003527'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                                >
                                    <span>
                                        {km === 5 ? '🏃 ' : km === 10 ? '🚶 ' : km === 15 ? '🚲 ' : km === 20 ? '🚗 ' : '🚕 '}
                                        Within {km} km
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500 }}>
                                        {km === 5 ? 'Very nearby' : km === 10 ? 'Nearby' : km === 15 ? 'Moderate' : km === 20 ? 'Wide area' : 'Large area'}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => { setSelectedRadius(null); sessionStorage.removeItem('ngo_radius'); setShowRadiusModal(false); fetchData(null, null, null); }}
                            style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', background: 'transparent', color: '#6B7280', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
                        >
                            Show all food (no radius filter)
                        </button>
                    </div>
                </div>
            )}

            {/* Route Modal */}
            {routeTarget && (
                <RouteMap
                    donorLat={routeTarget.lat}
                    donorLng={routeTarget.lng}
                    donorName={routeTarget.donorName}
                    foodType={routeTarget.foodType}
                    onClose={() => setRouteTarget(null)}
                />
            )}

            {/* Chat Modal — Feature 4 */}
            {chatPickupId && (
                <ChatBox
                    pickupId={chatPickupId}
                    currentUserPhone={phone}
                    currentUserRole="NGO"
                    onClose={() => setChatPickupId(null)}
                />
            )}

            {/* Image Set Modal */}
            {selectedImageSet && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setSelectedImageSet(null)}>
                    <div className="max-w-4xl w-full relative" onClick={e => e.stopPropagation()}>
                        <button 
                            className="absolute -top-12 right-0 text-white text-3xl font-bold p-2"
                            onClick={() => setSelectedImageSet(null)}
                        >
                            ×
                        </button>
                        <div className="flex flex-wrap justify-center gap-4 max-h-[80vh] overflow-y-auto p-4">
                            {selectedImageSet.map((url, i) => (
                                <div key={i} className="rounded-2xl overflow-hidden shadow-2xl bg-white p-2">
                                    <img src={url} alt={`Food ${i}`} className="max-w-full h-auto rounded-xl object-contain" style={{ maxHeight: '70vh' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* Sidebar */}
            <aside className="w-72 sidebar min-h-screen p-8 hidden lg:block">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 rounded-xl impact-gradient flex items-center justify-center text-white shadow-lg">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="font-headline font-bold text-xl text-primary">Living Network</span>
                </div>
                <nav className="space-y-2">
                    <div
                        onClick={() => setActiveView('list')}
                        className={`p-3 px-6 cursor-pointer transition-colors font-medium rounded-full ${activeView === 'list' ? 'nav-item-active' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                        📋 Food Feed
                    </div>
                    <div
                        onClick={() => setActiveView('map')}
                        className={`p-3 px-6 cursor-pointer transition-colors font-medium rounded-full ${activeView === 'map' ? 'nav-item-active' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                        🗺 Live Map {mappedCount > 0 && <span className="ml-1 text-xs bg-secondary-container text-on-secondary-fixed-variant px-2 py-0.5 rounded-full">{mappedCount}</span>}
                    </div>
                    <div
                        onClick={() => setActiveView('requests')}
                        className={`p-3 px-6 cursor-pointer transition-colors font-medium rounded-full ${activeView === 'requests' ? 'nav-item-active' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                        📦 My Requests {pendingRequests.length > 0 && <span className="ml-1 text-xs bg-primary text-on-primary px-2 py-0.5 rounded-full">{pendingRequests.length}</span>}
                    </div>
                    <div
                        onClick={() => setActiveView('history')}
                        className={`p-3 px-6 cursor-pointer transition-colors font-medium rounded-full ${activeView === 'history' ? 'nav-item-active' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                        📜 History {deliveredCount > 0 && <span className="ml-1 text-xs bg-secondary-container text-on-secondary-fixed-variant px-2 py-0.5 rounded-full">{deliveredCount}</span>}
                    </div>
                    <Link to="/" className="block p-3 px-6 text-on-surface-variant hover:text-primary cursor-pointer transition-colors font-medium" style={{ textDecoration: 'none' }}>
                        🏠 Home
                    </Link>
                </nav>
                <div className="mt-auto pt-10">
                    <div className="bg-surface-container-highest p-6 rounded-3xl">
                        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Your Impact</p>
                        <p className="text-3xl font-extrabold text-primary">{deliveredCount}</p>
                        <p className="text-sm text-on-surface-variant font-medium">Deliveries completed</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 lg:p-12">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-slide-up">
                    <div>
                        <p className="text-secondary font-semibold text-sm uppercase tracking-widest mb-2">The Curated Ecosystem</p>
                        <h1 className="text-4xl font-headline font-extrabold text-primary">NGO Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex bg-surface-container-low rounded-xl p-1">
                            <button
                                onClick={() => setActiveView('list')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'list' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
                            >
                                📋 List
                            </button>
                            <button
                                onClick={() => setActiveView('map')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'map' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
                            >
                                🗺 Map {mappedCount > 0 && `(${mappedCount})`}
                            </button>
                            <button
                                onClick={() => setActiveView('requests')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'requests' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
                            >
                                📦 Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
                            </button>
                            <button
                                onClick={() => setActiveView('history')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'history' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
                            >
                                📜 History
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Search food or location..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-56 px-4 py-3 bg-surface-container-lowest rounded-xl shadow-sm border-none focus:ring-2 focus:ring-surface-tint/40"
                        />
                    </div>
                </header>

                {message && (
                    <div className={`mb-8 px-5 py-4 rounded-xl font-semibold text-sm ${message.startsWith('Error') ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-primary-container'}`}>
                        {message}
                    </div>
                )}

                {/* Radius indicator with change button */}
                {selectedRadius ? (
                    <div className="mb-6 px-5 py-3 rounded-xl bg-primary-fixed text-primary-container flex items-center justify-between">
                        <span className="text-sm font-semibold">
                            📍 Showing food within <strong>{selectedRadius} km</strong> of your location
                        </span>
                        <button
                            onClick={() => setShowRadiusModal(true)}
                            className="text-xs font-extrabold px-3 py-1 rounded-lg bg-primary-container text-on-primary-container hover:scale-105 transition-transform"
                        >
                            Change Radius
                        </button>
                    </div>
                ) : (
                    <div className="mb-6 px-5 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                        <span className="text-sm font-semibold text-on-surface-variant">
                            🌐 Showing all available food (no radius filter)
                        </span>
                        <button
                            onClick={() => setShowRadiusModal(true)}
                            className="text-xs font-extrabold px-3 py-1 rounded-lg bg-primary text-on-primary hover:scale-105 transition-transform"
                        >
                            Set Radius
                        </button>
                    </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 animate-slide-up">
                    <div className="card-elevated">
                        <p className="text-secondary font-bold text-sm mb-2">Available Now</p>
                        <h3 className="text-5xl font-extrabold">{availableListings.length}</h3>
                        <p className="text-on-surface-variant text-sm mt-2">
                            {selectedRadius ? `within ${selectedRadius} km` : 'food listings'}
                        </p>
                    </div>
                    <div className="card-elevated">
                        <p className="text-primary font-bold text-sm mb-2">Active Requests</p>
                        <h3 className="text-5xl font-extrabold">{pendingRequests.length}</h3>
                        <p className="text-on-surface-variant text-sm mt-2">in progress</p>
                    </div>
                    <div className="card-elevated">
                        <p className="text-secondary font-bold text-sm mb-2">Mapped on Map</p>
                        <h3 className="text-5xl font-extrabold">{mappedCount}</h3>
                        <p className="text-on-surface-variant text-sm mt-2">
                            {geocodingStatus === 'loading' ? '⏳ Locating...' : 'donor locations'}
                        </p>
                    </div>
                </div>

                {/* ── MAP VIEW ── */}
                {activeView === 'map' && (
                    <div className="animate-slide-up">
                        {/* Geocoding progress banner */}
                        {geocodingStatus === 'loading' && (
                            <div className="mb-4 px-5 py-3 rounded-xl bg-secondary-container text-on-secondary-fixed-variant text-sm font-semibold flex items-center gap-3">
                                <span className="animate-spin">⏳</span>
                                Locating donor addresses on map... This may take a moment.
                            </div>
                        )}

                        <div className="card-elevated p-0 overflow-hidden" style={{ height: '600px' }}>
                            <div className="p-5 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-low">
                                <div>
                                    <h2 className="text-xl font-headline font-extrabold">Live Donor Locations</h2>
                                    <p className="text-xs text-on-surface-variant mt-1">
                                        {mappedCount > 0
                                            ? `${mappedCount} of ${availableListings.length} listings mapped · Click a pin to claim`
                                            : 'Waiting for donor locations...'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-secondary text-sm font-bold">
                                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                    LIVE
                                </div>
                            </div>

                            <div style={{ height: 'calc(100% - 69px)' }}>
                                <FoodMap
                                    listings={mappableListings}
                                    onClaim={handleClaim}
                                    onGetRoute={(listing) => setRouteTarget({
                                        lat: listing.latitude,
                                        lng: listing.longitude,
                                        donorName: listing.donor?.fullName || 'Donor',
                                        foodType: listing.foodType
                                    })}
                                    defaultSatellite={true}
                                />
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-4 flex flex-wrap gap-6 text-sm font-semibold">
                            <div className="flex items-center gap-2">
                                <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#416900', display: 'inline-block' }}></span>
                                Fresh (&gt;60 min)
                            </div>
                            <div className="flex items-center gap-2">
                                <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }}></span>
                                Expiring soon (&lt;60 min)
                            </div>
                            <div className="flex items-center gap-2">
                                <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#DC2626', display: 'inline-block' }}></span>
                                Urgent (&lt;15 min)
                            </div>
                            {availableListings.length > mappedCount && (
                                <div className="flex items-center gap-2 text-on-surface-variant">
                                    <span>⚠ {availableListings.length - mappedCount} listings have no location set</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── LIST VIEW ── */}
                {activeView === 'list' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
                        {/* Available Food */}
                        <div className="card-elevated">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-headline font-extrabold">Available Food</h2>
                                <div className="flex items-center gap-2 text-secondary text-sm font-bold">
                                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                    LIVE
                                </div>
                            </div>
                            {loading ? (
                                <div className="text-center py-12 text-on-surface-variant">Loading...</div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-12 opacity-50">
                                    <p className="font-bold text-on-surface-variant">No food available right now.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
                                    {filtered.map(listing => {
                                        const urgency = getExpiryUrgency(listing.expiryTime);
                                        const expiryColor = urgency === 'critical' ? '#DC2626' : urgency === 'warning' ? '#F59E0B' : '#416900';
                                        return (
                                            <div
                                                key={listing.id}
                                                className="flex items-center justify-between p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors"
                                                style={{ borderLeft: `3px solid ${expiryColor}` }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-xl bg-surface-container-lowest flex items-center justify-center shadow-sm overflow-hidden relative">
                                                        {listing.imageUrls && listing.imageUrls.length > 0 ? (
                                                            <>
                                                                <img 
                                                                    src={listing.imageUrls[0]} 
                                                                    alt="Food" 
                                                                    className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" 
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedImageSet(listing.imageUrls); }}
                                                                />
                                                                {listing.imageUrls.length > 1 && (
                                                                    <div className="absolute bottom-0 right-0 bg-primary/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-lg">
                                                                        +{listing.imageUrls.length - 1}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-xl">🍽</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg">{listing.foodType}</p>
                                                        <p className="text-on-surface-variant text-sm">{listing.quantity}</p>
                                                        <p className="text-on-surface-variant text-xs mt-0.5">📍 {listing.location?.split(',').slice(0, 2).join(',')}</p>
                                                        <p className="text-xs font-bold mt-1" style={{ color: expiryColor }}>
                                                            {urgency === 'critical' ? '⚠ URGENT · ' : ''}
                                                            Expires {new Date(listing.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        {listing.latitude && (
                                                            <div className="flex gap-3 mt-1">
                                                                <button
                                                                    onClick={() => setActiveView('map')}
                                                                    className="text-xs text-secondary font-bold hover:underline"
                                                                >
                                                                    🗺 View on map
                                                                </button>
                                                                <button
                                                                    onClick={() => setRouteTarget({
                                                                        lat: listing.latitude,
                                                                        lng: listing.longitude,
                                                                        donorName: listing.donor?.fullName || 'Donor',
                                                                        foodType: listing.foodType
                                                                    })}
                                                                    className="text-xs font-bold hover:underline"
                                                                    style={{ color: '#003527' }}
                                                                >
                                                                    🧭 Get Route & ETA
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 shrink-0">
                                                    <button
                                                        onClick={() => setSelectedDetailListing(listing)}
                                                        className="px-4 py-2 rounded-xl bg-primary/5 text-primary text-[10px] font-bold hover:bg-primary/10 transition-colors border border-primary/10"
                                                    >
                                                        Details
                                                    </button>
                                                    <button
                                                        onClick={() => handleClaim(listing.id)}
                                                        className="impact-gradient text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-sm hover:scale-105 transition-transform"
                                                    >
                                                        Claim
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* My Pickup Requests */}
                        <div className="card-elevated">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-headline font-extrabold">My Pickup Requests</h2>
                            </div>
                            {myRequests.length === 0 ? (
                                <div className="text-center py-12 opacity-50">
                                    <p className="font-bold text-on-surface-variant">No requests yet. Claim a listing!</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
                                    {myRequests.map(req => {
                                        const sc = statusBadge(req.status);
                                        return (
                                            <div key={req.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-xl bg-surface-container-lowest flex items-center justify-center shadow-sm overflow-hidden relative">
                                                        {req.imageUrls && req.imageUrls.length > 0 ? (
                                                            <>
                                                                <img 
                                                                    src={req.imageUrls[0]} 
                                                                    alt="Food" 
                                                                    className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" 
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedImageSet(req.imageUrls); }}
                                                                />
                                                                {req.imageUrls.length > 1 && (
                                                                    <div className="absolute bottom-0 right-0 bg-primary/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-lg">
                                                                        +{req.imageUrls.length - 1}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-xl">📦</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg">{req.foodType}</p>
                                                        <p className="text-on-surface-variant text-sm">{req.quantity}</p>
                                                        <p className="text-on-surface-variant text-xs mt-0.5">📍 {req.location?.split(',').slice(0, 2).join(',')}</p>
                                                        {req.volunteerName && (
                                                            <p className="text-xs text-secondary font-bold mt-1">🚴 {req.volunteerName}</p>
                                                        )}
                                                        <p className="text-xs font-bold mt-1" style={{ color: '#003527' }}>
                                                            📞 Donor: <a href={`tel:${req.donorPhone}`} className="hover:underline" style={{ color: 'inherit' }}>{req.donorPhone}</a>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-on-surface-variant text-xs font-bold uppercase mb-1">
                                                        {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                    <span
                                                        className="text-[10px] font-extrabold px-3 py-1 rounded-full"
                                                        style={{ background: sc.bg, color: sc.color }}
                                                    >
                                                        {req.status}
                                                    </span>
                                                    {req.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleReject(req.id)}
                                                            className="block mt-2 text-[10px] font-extrabold px-3 py-1 rounded-full bg-error-container text-on-error-container hover:scale-105 transition-transform"
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setChatPickupId(req.id)}
                                                        className="block mt-2 text-[10px] font-extrabold px-3 py-1 rounded-full bg-surface-container-high text-primary hover:scale-105 transition-transform"
                                                    >
                                                        💬 Chat
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── REQUESTS TAB — active only ── */}
                {activeView === 'requests' && (
                    <div className="card-elevated animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-headline font-extrabold">Active Pickup Requests</h2>
                            <span className="text-xs font-bold text-on-surface-variant">{pendingRequests.length} active</span>
                        </div>
                        {pendingRequests.length === 0 ? (
                            <div className="text-center py-16 opacity-50">
                                <p className="font-bold text-on-surface-variant">No active requests. Claim a listing from the Food Feed!</p>
                                {deliveredCount > 0 && (
                                    <button onClick={() => setActiveView('history')} className="mt-4 text-sm font-bold text-primary underline">
                                        View {deliveredCount} completed deliveries →
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingRequests.map(req => {
                                    const sc = statusBadge(req.status);
                                    return (
                                        <div key={req.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center shadow-sm">
                                                    <span className="text-xl">📦</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg">{req.foodType}</p>
                                                    <p className="text-on-surface-variant text-sm">{req.quantity}</p>
                                                    <p className="text-on-surface-variant text-xs mt-0.5">📍 {req.location?.split(',').slice(0, 2).join(',')}</p>
                                                    {req.volunteerName && (
                                                        <p className="text-xs text-secondary font-bold mt-1">🚴 {req.volunteerName}</p>
                                                    )}
                                                    <p className="text-xs font-bold mt-1" style={{ color: '#003527' }}>
                                                        📞 Donor: <a href={`tel:${req.donorPhone}`} className="hover:underline" style={{ color: 'inherit' }}>{req.donorPhone}</a>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-2">
                                                <p className="text-on-surface-variant text-xs font-bold uppercase">
                                                    {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </p>
                                                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                                                    {req.status}
                                                </span>
                                                {req.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleReject(req.id)}
                                                        className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-error-container text-on-error-container hover:scale-105 transition-transform"
                                                    >
                                                        Reject
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setChatPickupId(req.id)}
                                                    className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-surface-container-high text-primary hover:scale-105 transition-transform"
                                                >
                                                    💬 Chat
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── HISTORY TAB — delivered requests ── */}
                {activeView === 'history' && (
                    <div className="card-elevated animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-headline font-extrabold">Delivery History</h2>
                            <span className="text-xs font-bold bg-primary-fixed text-primary-container px-3 py-1 rounded-full">{deliveredCount} completed</span>
                        </div>
                        {deliveredRequests.length === 0 ? (
                            <div className="text-center py-16 opacity-50">
                                <p className="font-bold text-on-surface-variant">No completed deliveries yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {deliveredRequests.map(req => (
                                    <div key={req.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors border-l-4 border-secondary">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center shadow-sm">
                                                <span className="text-xl">✅</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg">{req.foodType}</p>
                                                <p className="text-on-surface-variant text-sm">{req.quantity}</p>
                                                <p className="text-on-surface-variant text-xs mt-0.5">📍 {req.location?.split(',').slice(0, 2).join(',')}</p>
                                                {req.volunteerName && (
                                                    <p className="text-xs text-secondary font-bold mt-1">🚴 Delivered by {req.volunteerName}</p>
                                                )}
                                                <p className="text-xs text-on-surface-variant mt-1">
                                                    Donor: {req.donorName} · <a href={`tel:${req.donorPhone}`} className="hover:underline font-bold" style={{ color: '#003527' }}>{req.donorPhone}</a>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-on-surface-variant text-xs font-bold uppercase mb-1">
                                                {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                            <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-primary-fixed text-primary-container">
                                                DELIVERED ✓
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
            {/* Listing Detail Modal */}
            {selectedDetailListing && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedDetailListing(null)}>
                    <div className="max-w-2xl w-full bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="relative h-64 bg-surface-container-low">
                            {selectedDetailListing.imageUrls && selectedDetailListing.imageUrls.length > 0 ? (
                                <div className="flex h-full overflow-x-auto snap-x scrollbar-hide">
                                    {selectedDetailListing.imageUrls.map((url, i) => (
                                        <img key={i} src={url} alt={`Food ${i}`} className="h-full w-full object-cover shrink-0 snap-center" />
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-6xl opacity-10">🍽</div>
                            )}
                            <button 
                                onClick={() => setSelectedDetailListing(null)}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center font-bold text-xl backdrop-blur-md"
                            >
                                ×
                            </button>
                            {selectedDetailListing.imageUrls?.length > 1 && (
                                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md">
                                    {selectedDetailListing.imageUrls.length} Photos · Swipe →
                                </div>
                            )}
                        </div>
                        
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-primary mb-2">{selectedDetailListing.foodType}</h2>
                                    <p className="text-secondary font-bold">👤 {selectedDetailListing.donor?.fullName || 'Anonymous Donor'}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">📦 {selectedDetailListing.quantity}</div>
                                    <p className="text-xs text-on-surface-variant font-medium">Available Quantity</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10">
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Preparation</p>
                                    <p className="text-sm font-bold">{new Date(selectedDetailListing.preparationTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Expiry</p>
                                    <p className="text-sm font-bold text-primary">{new Date(selectedDetailListing.expiryTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-on-surface-variant">
                                    <span className="text-xl">📍</span>
                                    <div>
                                        <p className="text-xs font-bold opacity-50 uppercase tracking-tighter">Pickup Location</p>
                                        <p className="text-sm font-medium">{selectedDetailListing.location}</p>
                                    </div>
                                </div>
                                {selectedDetailListing.packagingDetails && (
                                    <div className="flex items-center gap-3 text-on-surface-variant">
                                        <span className="text-xl">🥡</span>
                                        <div>
                                            <p className="text-xs font-bold opacity-50 uppercase tracking-tighter">Packaging Details</p>
                                            <p className="text-sm font-medium">{selectedDetailListing.packagingDetails}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => {
                                        setSelectedDetailListing(null);
                                        handleClaim(selectedDetailListing.id);
                                    }}
                                    className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                                >
                                    Claim This Donation →
                                </button>
                                <button 
                                    onClick={() => {
                                        const l = selectedDetailListing;
                                        setSelectedDetailListing(null);
                                        if (l.latitude && l.longitude) {
                                            setRouteTarget({
                                                lat: l.latitude,
                                                lng: l.longitude,
                                                donorName: l.donor?.fullName || 'Donor',
                                                foodType: l.foodType
                                            });
                                        }
                                    }}
                                    className="px-6 rounded-2xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-colors"
                                >
                                    🗺 Route
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Listing Detail Modal */}
            {selectedDetailListing && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedDetailListing(null)}>
                    <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="relative h-64 bg-slate-100">
                            {selectedDetailListing.imageUrls && selectedDetailListing.imageUrls.length > 0 ? (
                                <div className="flex h-full overflow-x-auto snap-x scrollbar-hide">
                                    {selectedDetailListing.imageUrls.map((url, i) => (
                                        <img key={i} src={url} alt={`Food ${i}`} className="h-full w-full object-cover shrink-0 snap-center" />
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-6xl opacity-10">🍽</div>
                            )}
                            <button 
                                onClick={() => setSelectedDetailListing(null)}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center font-bold text-xl backdrop-blur-md"
                            >
                                ×
                            </button>
                            {selectedDetailListing.imageUrls?.length > 1 && (
                                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md">
                                    {selectedDetailListing.imageUrls.length} Photos · Swipe →
                                </div>
                            )}
                        </div>
                        
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-primary mb-1">{selectedDetailListing.foodType}</h2>
                                    <p className="text-secondary font-bold">👤 {selectedDetailListing.donorName || selectedDetailListing.donor?.fullName || 'Donor'}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">📦 {selectedDetailListing.quantity}</div>
                                    <p className="text-xs text-on-surface-variant font-medium">Available Quantity</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Preparation</p>
                                    <p className="text-sm font-bold">{new Date(selectedDetailListing.preparationTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Expiry</p>
                                    <p className="text-sm font-bold text-red-600">{new Date(selectedDetailListing.expiryTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <span className="text-xl">📍</span>
                                    <div>
                                        <p className="text-xs font-bold opacity-50 uppercase tracking-tighter">Pickup Location</p>
                                        <p className="text-sm font-medium">{selectedDetailListing.location}</p>
                                    </div>
                                </div>
                                {selectedDetailListing.packagingDetails && (
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <span className="text-xl">🥡</span>
                                        <div>
                                            <p className="text-xs font-bold opacity-50 uppercase tracking-tighter">Packaging Details</p>
                                            <p className="text-sm font-medium">{selectedDetailListing.packagingDetails}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => {
                                        setSelectedDetailListing(null);
                                        handleClaim(selectedDetailListing.id);
                                    }}
                                    className="flex-1 py-4 rounded-2xl impact-gradient text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                                >
                                    Claim Donation →
                                </button>
                                {selectedDetailListing.latitude && (
                                    <button 
                                        onClick={() => {
                                            const l = selectedDetailListing;
                                            setSelectedDetailListing(null);
                                            setRouteTarget({
                                                lat: l.latitude,
                                                lng: l.longitude,
                                                donorName: l.donor?.fullName || 'Donor',
                                                foodType: l.foodType
                                            });
                                        }}
                                        className="px-6 rounded-2xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-colors"
                                    >
                                        🗺 Route
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NGOFeed;
