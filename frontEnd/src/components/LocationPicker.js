import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom draggable pin icon
const pinIcon = L.divIcon({
    html: `<div style="
        width: 36px; height: 36px;
        background: linear-gradient(135deg, #003527, #064e3b);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 16px rgba(0,53,39,0.4);
        display: flex; align-items: center; justify-content: center;
    ">
        <div style="transform: rotate(45deg); font-size: 14px; margin-top: -2px;">📍</div>
    </div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -40],
});

// Component that handles map click to drop pin
const MapClickHandler = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

// Component that pans map to new center
const MapPanner = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 16, { animate: true });
        }
    }, [center, map]);
    return null;
};

/**
 * LocationPicker — Zepto/BigBasket style location selector.
 *
 * Features:
 * - Type address → live autocomplete suggestions from Nominatim
 * - Click on map → drops pin at that location
 * - Drag pin → updates location
 * - "Use my current location" button
 * - Shows full address of selected location
 *
 * Props:
 *   initialLat, initialLng — pre-selected coordinates
 *   initialAddress — pre-filled address text
 *   onLocationChange — callback({ lat, lng, address })
 */
const LocationPicker = ({ initialLat, initialLng, initialAddress = '', onLocationChange }) => {
    const [searchText, setSearchText] = useState(initialAddress);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedLat, setSelectedLat] = useState(initialLat || null);
    const [selectedLng, setSelectedLng] = useState(initialLng || null);
    const [selectedAddress, setSelectedAddress] = useState(initialAddress);
    const [mapCenter, setMapCenter] = useState(
        initialLat && initialLng ? [initialLat, initialLng] : [20.5937, 78.9629]
    );
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchTimeout = useRef(null);
    const suggestionsRef = useRef(null);

    // Reverse geocode: coordinates → address string
    const reverseGeocode = useCallback(async (lat, lng) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { 'Accept-Language': 'en', 'User-Agent': 'HarvestLink/1.0' } }
            );
            const data = await res.json();
            if (data && data.display_name) {
                return data.display_name;
            }
        } catch (e) {}
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }, []);

    // Forward geocode: address → suggestions list
    const searchAddress = useCallback(async (query) => {
        if (!query || query.length < 3) { setSuggestions([]); return; }
        setSearchLoading(true);
        try {
            const encoded = encodeURIComponent(query);
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=6&addressdetails=1`,
                { headers: { 'Accept-Language': 'en', 'User-Agent': 'HarvestLink/1.0' } }
            );
            const data = await res.json();
            setSuggestions(data || []);
            setShowSuggestions(true);
        } catch (e) {
            setSuggestions([]);
        } finally {
            setSearchLoading(false);
        }
    }, []);

    // Debounced search
    const handleSearchInput = (value) => {
        setSearchText(value);
        clearTimeout(searchTimeout.current);
        if (value.length >= 3) {
            searchTimeout.current = setTimeout(() => searchAddress(value), 400);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // User selects a suggestion
    const handleSuggestionSelect = (suggestion) => {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);
        const address = suggestion.display_name;
        setSelectedLat(lat);
        setSelectedLng(lng);
        setSelectedAddress(address);
        setSearchText(address);
        setMapCenter([lat, lng]);
        setShowSuggestions(false);
        setSuggestions([]);
        onLocationChange({ lat, lng, address });
    };

    // User clicks on map
    const handleMapClick = async (lat, lng) => {
        setSelectedLat(lat);
        setSelectedLng(lng);
        setMapCenter([lat, lng]);
        const address = await reverseGeocode(lat, lng);
        setSelectedAddress(address);
        setSearchText(address);
        onLocationChange({ lat, lng, address });
    };

    // Use device GPS
    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setSelectedLat(lat);
                setSelectedLng(lng);
                setMapCenter([lat, lng]);
                const address = await reverseGeocode(lat, lng);
                setSelectedAddress(address);
                setSearchText(address);
                setLoadingLocation(false);
                onLocationChange({ lat, lng, address });
            },
            (err) => {
                setLoadingLocation(false);
                alert('Could not get your location. Please allow location access or type your address.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Close suggestions on outside click
    useEffect(() => {
        const handler = (e) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Search bar */}
            <div style={{ position: 'relative' }} ref={suggestionsRef}>
                <div style={{ position: 'relative' }}>
                    <span style={{
                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                        fontSize: '18px', pointerEvents: 'none'
                    }}>🔍</span>
                    <input
                        type="text"
                        value={searchText}
                        onChange={e => handleSearchInput(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        placeholder="Search address, landmark, area..."
                        style={{
                            width: '100%', padding: '14px 44px 14px 44px',
                            borderRadius: '12px', border: '2px solid #E5E7EB',
                            fontSize: '0.95rem', outline: 'none', background: 'white',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.2s',
                        }}
                        onFocusCapture={e => e.target.style.borderColor = '#003527'}
                        onBlurCapture={e => e.target.style.borderColor = '#E5E7EB'}
                    />
                    {searchLoading && (
                        <span style={{
                            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                            fontSize: '14px', color: '#9CA3AF'
                        }}>⏳</span>
                    )}
                    {searchText && !searchLoading && (
                        <button
                            onClick={() => { setSearchText(''); setSuggestions([]); setShowSuggestions(false); }}
                            style={{
                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9CA3AF'
                            }}
                        >✕</button>
                    )}
                </div>

                {/* Autocomplete dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 2000,
                        background: 'white', borderRadius: '12px', marginTop: '4px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #E5E7EB',
                        maxHeight: '280px', overflowY: 'auto'
                    }}>
                        {suggestions.map((s, i) => (
                            <div
                                key={i}
                                onClick={() => handleSuggestionSelect(s)}
                                style={{
                                    padding: '12px 16px', cursor: 'pointer',
                                    borderBottom: i < suggestions.length - 1 ? '1px solid #F3F4F6' : 'none',
                                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#F0FDF4'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                            >
                                <span style={{ fontSize: '16px', marginTop: '2px', flexShrink: 0 }}>📍</span>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#003527' }}>
                                        {s.display_name.split(',')[0]}
                                    </p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6B7280' }}>
                                        {s.display_name.split(',').slice(1, 4).join(',')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Use current location button */}
            <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={loadingLocation}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 16px', borderRadius: '10px',
                    border: '2px solid #003527', background: 'white',
                    color: '#003527', fontWeight: 700, fontSize: '0.875rem',
                    cursor: 'pointer', width: 'fit-content',
                    transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#003527'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#003527'; }}
            >
                {loadingLocation ? '⏳ Getting location...' : '🎯 Use my current location'}
            </button>

            {/* Map */}
            <div style={{
                height: '380px', borderRadius: '16px', overflow: 'hidden',
                border: '2px solid #E5E7EB', position: 'relative'
            }}>
                <div style={{
                    position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 1000, background: 'rgba(0,53,39,0.85)', color: 'white',
                    padding: '6px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600,
                    pointerEvents: 'none', whiteSpace: 'nowrap'
                }}>
                    📌 Click anywhere on map to set location
                </div>
                <MapContainer
                    center={mapCenter}
                    zoom={selectedLat ? 16 : 5}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution="Tiles &copy; Esri"
                        maxZoom={19}
                    />
                    <MapClickHandler onLocationSelect={handleMapClick} />
                    <MapPanner center={mapCenter} />
                    {selectedLat && selectedLng && (
                        <Marker position={[selectedLat, selectedLng]} icon={pinIcon} />
                    )}
                </MapContainer>
            </div>

            {/* Selected location display */}
            {selectedLat && selectedLng && (
                <div style={{
                    background: '#F0FDF4', border: '1px solid #BBF7D0',
                    borderRadius: '10px', padding: '12px 16px',
                    display: 'flex', alignItems: 'flex-start', gap: '10px'
                }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>✅</span>
                    <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#003527' }}>
                            Location confirmed
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#065F46', lineHeight: 1.4 }}>
                            {selectedAddress}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#9CA3AF' }}>
                            {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
