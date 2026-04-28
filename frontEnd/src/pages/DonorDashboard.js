import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LocationPicker from '../components/LocationPicker';
import ChatBox from '../components/ChatBox';
import useWebSocket from '../hooks/useWebSocket';

const DonorDashboard = () => {
    const [stats, setStats] = useState({ mealsShared: 0, co2OffsetTons: 0, activeListings: 0 });
    const [myListings, setMyListings] = useState([]);
    const [activePickups, setActivePickups] = useState([]); // food claimed by NGOs, in progress
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [postForm, setPostForm] = useState({ foodType: '', quantity: '', preparationTime: '', expiryTime: '', foodCategory: 'EDIBLE' });
    const [postLocation, setPostLocation] = useState({ lat: null, lng: null, address: '' });
    const [postMsg, setPostMsg] = useState('');
    const [profileForm, setProfileForm] = useState({ fullName: '', organizationName: '' });
    const [profileLocation, setProfileLocation] = useState({ lat: null, lng: null, address: '' });
    const [profileMsg, setProfileMsg] = useState('');
    const [saving, setSaving] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [deliveryNote, setDeliveryNote] = useState('');
    const [confirmingId, setConfirmingId] = useState(null); // which pickup is being confirmed
    const [chatPickupId, setChatPickupId] = useState(null); // Feature 4: Chat
    const [message, setMessage] = useState(''); // Live notifications
    const navigate = useNavigate();

    const token = sessionStorage.getItem('token');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, listingsRes, profileRes, activePickupsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/food/my-stats`, authHeader),
                axios.get(`${API_BASE_URL}/api/food/my-listings`, authHeader),
                axios.get(`${API_BASE_URL}/api/profile`, authHeader),
                axios.get(`${API_BASE_URL}/api/pickups/donor-active`, authHeader),
            ]);
            setStats(statsRes.data);
            
            const rawListings = listingsRes.data;
            const now = new Date();
            
            // Active Listings = AVAILABLE AND not expired
            const active = rawListings.filter(l => 
                l.status === 'AVAILABLE' && new Date(l.expiryTime) > now
            );
            
            setMyListings(rawListings); 
            setActivePickups(activePickupsRes.data);
            const p = profileRes.data;
            setProfile(p);
            setProfileForm({ fullName: p.fullName || '', organizationName: p.organizationName || '' });
            // Use null (not 0) for unset coordinates — 0 is a valid coordinate
            const lat = (p.latitude !== null && p.latitude !== undefined) ? p.latitude : null;
            const lng = (p.longitude !== null && p.longitude !== undefined) ? p.longitude : null;
            setProfileLocation({ lat, lng, address: p.address || '' });
            // Pre-fill post form location from profile if location is saved
            if (p.address && lat !== null) {
                setPostLocation({ lat, lng, address: p.address });
            }
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                sessionStorage.clear(); navigate('/login');
            }
        } finally { setLoading(false); }
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);
    
    const phone = sessionStorage.getItem('phone');

    // WebSocket: listen for claims
    useWebSocket(
        [phone ? `/topic/donor/${phone}` : ''].filter(Boolean),
        useCallback((topic, data) => {
            if (data.type === 'LISTING_CLAIMED' || data.type === 'VOLUNTEER_ASSIGNED' || data.type === 'PICKED_UP' || data.type === 'DELIVERED') {
                setMessage(`🔔 ${data.message || 'Status updated for your donation'}`);
                setTimeout(() => setMessage(''), 8000);
                fetchData();
            }
        }, [fetchData, phone])
    );

    const handlePost = async (e) => {
        e.preventDefault();
        if (!postLocation.address) {
            setPostMsg('Error: Please set a pickup location on the map.');
            return;
        }
        if (!postForm.foodType?.trim()) { setPostMsg('Error: Food type is required.'); return; }
        if (!postForm.quantity?.trim()) { setPostMsg('Error: Quantity is required.'); return; }
        if (!postForm.preparationTime) { setPostMsg('Error: Preparation time is required.'); return; }
        if (!postForm.expiryTime) { setPostMsg('Error: Expiry time is required.'); return; }
        setPostMsg('');
        setSaving(true);
        try {
            const payload = {
                foodType: postForm.foodType,
                quantity: postForm.quantity,
                preparationTime: postForm.preparationTime,
                expiryTime: postForm.expiryTime,
                foodCategory: postForm.foodCategory || 'EDIBLE',
                location: postLocation.address,
                latitude: postLocation.lat,
                longitude: postLocation.lng,
            };
            const res = await axios.post(`${API_BASE_URL}/api/food/list`, payload, authHeader);
            const listingId = res.data.id;

            // Upload images if any
            if (selectedFiles.length > 0) {
                setPostMsg('Uploading images...');
                const formData = new FormData();
                selectedFiles.forEach(file => formData.append('images', file));
                await axios.post(`${API_BASE_URL}/api/images/food-listing/${listingId}/multiple`, formData, {
                    headers: { ...authHeader.headers, 'Content-Type': 'multipart/form-data' }
                });
            }

            setPostMsg('✓ Donation posted and visible on the NGO map!');
            setPostForm({ foodType: '', quantity: '', preparationTime: '', expiryTime: '', foodCategory: 'EDIBLE' });
            setSelectedFiles([]);
            setPreviews([]);
            setTimeout(() => { setActiveTab('overview'); fetchData(); }, 1500);
        } catch (err) {
            setPostMsg('Error: ' + (err.response?.data?.message || 'Could not post donation.'));
        } finally { setSaving(false); }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
        
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        // Allow save if location already exists in profile OR if user just set a new one
        const hasLocation = profileLocation.address || profile?.address;
        if (!hasLocation) {
            setProfileMsg('Error: Please set your location on the map.');
            return;
        }
        setProfileMsg('');
        setSaving(true);
        try {
            // Use newly picked location, or fall back to existing profile location
            const finalLat = profileLocation.lat ?? profile?.latitude;
            const finalLng = profileLocation.lng ?? profile?.longitude;
            const finalAddress = profileLocation.address || profile?.address;

            const payload = {
                fullName: profileForm.fullName,
                organizationName: profileForm.organizationName,
                address: finalAddress,
            };
            // Only include lat/lng if they are valid numbers
            if (finalLat !== null && finalLat !== undefined) {
                payload.latitude = String(finalLat);
                payload.longitude = String(finalLng);
            }

            const res = await axios.patch(`${API_BASE_URL}/api/profile`, payload, authHeader);
            setProfile(res.data);
            setProfileMsg('✓ Profile saved!');
            fetchData();
        } catch (err) {
            setProfileMsg('Error: ' + (err.response?.data?.message || 'Could not save profile.'));
        } finally { setSaving(false); }
    };

    const handleConfirmDelivery = async (pickupId) => {
        setSaving(true);
        try {
            await axios.patch(
                `${API_BASE_URL}/api/pickups/${pickupId}/donor-confirm-delivery`,
                { note: deliveryNote },
                authHeader
            );
            setConfirmingId(null);
            setDeliveryNote('');
            setMessage('✅ Delivery confirmed! Thank you for your contribution.');
            setTimeout(() => setMessage(''), 5000);
            fetchData();
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not confirm delivery.';
            setMessage('Error: ' + msg);
            setTimeout(() => setMessage(''), 5000);
        } finally { setSaving(false); }
    };

    const statusColor = (s, expiryTime) => {
        const isExpired = expiryTime && new Date(expiryTime) < new Date();
        if (isExpired && (s === 'AVAILABLE' || s === 'ACCEPTED')) return '#FEE2E2'; // Reddish for expired
        const map = { AVAILABLE: '#acf847', ACCEPTED: '#FEF3C7', PICKED_UP: '#DBEAFE', DELIVERED: '#b0f0d6', EXPIRED: '#FEE2E2', CANCELLED: '#FCA5A5' };
        return map[s] || '#E5E7EB';
    };

    return (
        <div className="flex min-h-screen bg-surface">
             {/* Chat Modal — Feature 4 */}
            {chatPickupId && (
                <ChatBox
                    pickupId={chatPickupId}
                    currentUserPhone={sessionStorage.getItem('phone')}
                    currentUserRole="DONOR"
                    onClose={() => setChatPickupId(null)}
                />
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
                    {[
                        { key: 'overview', label: '📊 Impact Overview' },
                        { key: 'post', label: '➕ Post Donation' },
                        { key: 'profile', label: '📍 My Location' },
                    ].map(item => (
                        <div key={item.key}
                            onClick={() => setActiveTab(item.key)}
                            className={`p-3 px-6 cursor-pointer transition-colors font-medium rounded-full ${activeTab === item.key ? 'nav-item-active' : 'text-on-surface-variant hover:text-primary'}`}>
                            {item.label}
                        </div>
                    ))}
                    <Link to="/" className="block p-3 px-6 text-on-surface-variant hover:text-primary cursor-pointer transition-colors font-medium" style={{ textDecoration: 'none' }}>🏠 Home</Link>
                </nav>
                <div className="mt-auto pt-10">
                    <div className="bg-primary-container p-6 rounded-3xl text-white">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Map Status</p>
                        {profile?.latitude ? (
                            <>
                                <p className="text-sm font-bold text-secondary-container">✓ Location Set</p>
                                <p className="text-xs opacity-70 mt-1 break-words">{profile.address?.split(',').slice(0, 2).join(',')}</p>
                            </>
                        ) : (
                            <p className="text-sm font-medium opacity-80">⚠ Set location to appear on NGO map</p>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-slide-up">
                    <div>
                        <p className="text-secondary font-semibold text-sm uppercase tracking-widest mb-2">The Curated Ecosystem</p>
                        <h1 className="text-4xl font-headline font-extrabold text-primary">Donor Dashboard</h1>
                    </div>
                    <button onClick={() => setActiveTab('post')} className="impact-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
                        + Post Donation
                    </button>
                </header>

                {message && (
                    <div className="mb-8 px-5 py-4 rounded-xl bg-primary-fixed text-primary-container font-semibold text-sm animate-slide-up">
                        {message}
                    </div>
                )}

                {/* ── OVERVIEW TAB ── */}
                {activeTab === 'overview' && (
                    <>
                        {profile?.latitude == null && !profile?.address && !loading && (
                            <div className="mb-8 px-5 py-4 rounded-xl bg-secondary-container text-on-secondary-fixed-variant font-semibold text-sm flex items-center justify-between">
                                <span>⚠ Your location is not set. NGOs won't see you on the map.</span>
                                <button onClick={() => setActiveTab('profile')} className="text-xs font-extrabold underline ml-4">Set Location →</button>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-slide-up">
                            {[
                                { label: 'Meals Shared', value: stats.mealsShared.toLocaleString() },
                                { label: 'CO2 Offset (tons)', value: stats.co2OffsetTons.toFixed(2) },
                                { label: 'Active Listings', value: stats.activeListings.toString() },
                            ].map((stat, idx) => (
                                <div key={idx} className="card-elevated">
                                    <p className="text-on-surface-variant font-bold text-sm mb-2">{stat.label}</p>
                                    <h3 className="text-4xl font-extrabold">{loading ? '...' : stat.value}</h3>
                                </div>
                            ))}
                        </div>
                        <div className="card-elevated animate-slide-up">
                            {/* ── ACTIVE PICKUPS — Donor confirms delivery ── */}
                            {activePickups.length > 0 && (
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-headline font-extrabold text-primary">🚚 Active Pickups</h2>
                                        <span className="text-xs font-bold bg-secondary-container text-on-secondary-fixed-variant px-3 py-1 rounded-full">
                                            {activePickups.length} in progress
                                        </span>
                                    </div>
                                    <div className="space-y-4 mb-8">
                                        {activePickups.map(pickup => (
                                            <div key={pickup.id} className="rounded-2xl border-2 border-primary-fixed overflow-hidden">
                                                <div className="p-4 bg-primary-fixed/30 flex items-center justify-between">
                                                    <div>
                                                        <p className="font-extrabold text-primary">{pickup.foodType}</p>
                                                        <p className="text-sm text-on-surface-variant">{pickup.quantity}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-primary text-on-primary">
                                                            {pickup.status.replace('_', ' ')}
                                                        </span>
                                                        <p className="text-xs text-on-surface-variant mt-1">NGO: {pickup.ngoName}</p>
                                                        <p className="text-xs font-bold mt-1" style={{ color: '#003527' }}>
                                                            📞 NGO: <a href={`tel:${pickup.ngoPhone}`} className="hover:underline" style={{ color: 'inherit' }}>{pickup.ngoPhone}</a>
                                                        </p>
                                                        {pickup.volunteerName && <p className="text-xs text-secondary font-bold">🚴 {pickup.volunteerName}</p>}
                                                    </div>
                                                </div>

                                                {/* Confirm delivery section */}
                                                {confirmingId === pickup.id ? (
                                                    <div className="p-4 bg-surface-container-low">
                                                        <p className="text-sm font-semibold text-primary mb-3">
                                                            ✅ Confirm that <strong>{pickup.ngoName}</strong> has received the food?
                                                        </p>
                                                        <textarea
                                                            value={deliveryNote}
                                                            onChange={e => setDeliveryNote(e.target.value)}
                                                            placeholder="Optional: Add a note (e.g., 'Delivered to main gate', 'All 50 plates received')"
                                                            rows={2}
                                                            className="w-full px-3 py-2 rounded-xl border border-outline-variant text-sm mb-3 resize-none"
                                                            style={{ outline: 'none' }}
                                                        />
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => handleConfirmDelivery(pickup.id)}
                                                                disabled={saving}
                                                                className="flex-1 impact-gradient text-white py-2 rounded-xl font-extrabold text-sm hover:scale-105 transition-transform disabled:opacity-60"
                                                            >
                                                                {saving ? 'Confirming...' : '✓ Yes, Food Delivered!'}
                                                            </button>
                                                            <button
                                                                onClick={() => { setConfirmingId(null); setDeliveryNote(''); }}
                                                                className="px-4 py-2 rounded-xl font-bold text-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                     <div className="p-3 flex justify-end gap-3">
                                                        <button
                                                            onClick={() => setChatPickupId(pickup.id)}
                                                            className="text-sm font-extrabold px-4 py-2 rounded-xl bg-surface-container-high text-primary hover:scale-105 transition-transform"
                                                        >
                                                            💬 Chat
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmingId(pickup.id)}
                                                            className="text-sm font-extrabold px-4 py-2 rounded-xl bg-primary-fixed text-primary-container hover:scale-105 transition-transform"
                                                        >
                                                            📦 Mark as Delivered
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <hr className="border-outline-variant/20 mb-8" />
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-headline font-extrabold text-primary">My Donation History</h2>
                                <span className="text-xs font-bold text-on-surface-variant tracking-widest uppercase">{myListings.length} total</span>
                            </div>
                            {loading ? (
                                <div className="text-center py-12 text-on-surface-variant">Loading...</div>
                            ) : myListings.length === 0 ? (
                                <div className="text-center py-12 text-on-surface-variant opacity-50">
                                    <p className="font-bold">No donations yet. Post your first one!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myListings.map(listing => {
                                        const isExpired = new Date(listing.expiryTime) < new Date();
                                        const displayStatus = (isExpired && (listing.status === 'AVAILABLE' || listing.status === 'ACCEPTED')) ? 'EXPIRED' : listing.status;
                                        
                                        return (
                                            <div key={listing.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center shadow-sm overflow-hidden">
                                                        {listing.imageUrls && listing.imageUrls.length > 0 ? (
                                                            <img src={listing.imageUrls[0]} alt="Food" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-lg">🍽</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{listing.foodType}</p>
                                                        <p className="text-on-surface-variant text-sm">{listing.quantity} · {listing.location?.split(',').slice(0, 2).join(',')}</p>
                                                        {listing.latitude && !isExpired && listing.status === 'AVAILABLE' && <p className="text-xs text-secondary font-bold mt-1">📍 Live on NGO map</p>}
                                                        {isExpired && (listing.status === 'AVAILABLE' || listing.status === 'ACCEPTED') && <p className="text-xs text-error font-bold mt-1">⌛ Automatically expired</p>}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-on-surface-variant text-xs font-bold mb-1">
                                                        {new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                    <span className="text-[10px] font-extrabold px-3 py-1 rounded-full" style={{ background: statusColor(listing.status, listing.expiryTime), color: '#003527' }}>
                                                        {displayStatus}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ── POST DONATION TAB ── */}
                {activeTab === 'post' && (
                    <div className="animate-slide-up space-y-8">
                        <div className="card-elevated">
                            <h2 className="text-xl font-headline font-extrabold text-primary mb-1">Post New Surplus Food</h2>
                            <p className="text-on-surface-variant text-sm mb-6">Set the exact pickup location on the map so NGOs can find you.</p>
                            <form onSubmit={handlePost}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-primary/80 mb-2">Food Type</label>
                                        <input required value={postForm.foodType} onChange={e => setPostForm({ ...postForm, foodType: e.target.value })} placeholder="e.g., Prepared Rice, Bread" className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl shadow-sm border-none focus:ring-2 focus:ring-surface-tint/40" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-primary/80 mb-2">Quantity</label>
                                        <input required value={postForm.quantity} onChange={e => setPostForm({ ...postForm, quantity: e.target.value })} placeholder="e.g., 50 plates, 10 kg" className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl shadow-sm border-none focus:ring-2 focus:ring-surface-tint/40" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-primary/80 mb-2">Prepared At</label>
                                        <input type="datetime-local" required value={postForm.preparationTime} onChange={e => setPostForm({ ...postForm, preparationTime: e.target.value })} className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl shadow-sm border-none focus:ring-2 focus:ring-surface-tint/40" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-primary/80 mb-2">Best Before</label>
                                        <input type="datetime-local" required value={postForm.expiryTime} onChange={e => setPostForm({ ...postForm, expiryTime: e.target.value })} className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl shadow-sm border-none focus:ring-2 focus:ring-surface-tint/40" />
                                    </div>
                                </div>

                                {/* Food Category */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-primary/80 mb-3">Food Category</label>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { value: 'EDIBLE', label: '🍽 Edible (for people)', desc: 'Goes to NGOs' },
                                            { value: 'NON_EDIBLE', label: '🐾 Non-Edible (animal feed)', desc: 'Goes to Animal Care' },
                                            { value: 'BAKERY', label: '🥖 Bakery' },
                                            { value: 'COOKED', label: '🍲 Cooked Food' },
                                            { value: 'RAW', label: '🥦 Raw / Vegetables' },
                                            { value: 'BEVERAGES', label: '🥤 Beverages' },
                                        ].map(cat => (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => setPostForm({ ...postForm, foodCategory: cat.value })}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${postForm.foodCategory === cat.value ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary/50'}`}
                                            >
                                                {cat.label}
                                                {cat.desc && <span className="block text-[10px] font-normal opacity-70">{cat.desc}</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Location Picker — pre-filled from profile, key forces remount when profile loads */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-primary/80 mb-3">
                                        📍 Pickup Location <span className="text-secondary font-bold">(search or click on map)</span>
                                    </label>
                                    {postLocation.address && (
                                        <div className="mb-2 px-3 py-2 rounded-lg bg-primary-fixed/30 text-primary text-xs font-semibold">
                                            📍 Using: {postLocation.address.split(',').slice(0, 3).join(',')} — click map to change
                                        </div>
                                    )}
                                    <LocationPicker
                                        key={postLocation.address || 'post-no-loc'}
                                        initialLat={postLocation.lat}
                                        initialLng={postLocation.lng}
                                        initialAddress={postLocation.address}
                                        onLocationChange={loc => setPostLocation(loc)}
                                    />
                                </div>

                                {/* Multi-Photo Upload */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-primary/80 mb-3">
                                        📸 Food Photos <span className="text-on-surface-variant font-normal">(optional, but helps NGOs)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-4 mb-3">
                                        {previews.map((url, i) => (
                                            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden shadow-md group">
                                                <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(i)}
                                                    className="absolute top-1 right-1 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        <label className="w-24 h-24 rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-high transition-colors">
                                            <span className="text-2xl text-on-surface-variant">+</span>
                                            <span className="text-[10px] font-bold text-on-surface-variant uppercase">Add Photo</span>
                                            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-on-surface-variant opacity-60">Upload clear photos of the food and packaging.</p>
                                </div>

                                {postMsg && (
                                    <div className={`px-4 py-3 rounded-xl text-sm font-medium mb-4 ${postMsg.startsWith('Error') ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-primary-container'}`}>
                                        {postMsg}
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <button type="submit" disabled={saving} className="impact-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-60">
                                        {saving ? 'Posting...' : 'Broadcast to Network'}
                                    </button>
                                    <button type="button" onClick={() => setActiveTab('overview')} className="px-6 py-3 rounded-xl font-bold border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── PROFILE / LOCATION TAB ── */}
                {activeTab === 'profile' && (
                    <div className="animate-slide-up space-y-8">
                        <div className="card-elevated">
                            <h2 className="text-xl font-headline font-extrabold text-primary mb-1">My Profile & Location</h2>
                            <p className="text-on-surface-variant text-sm mb-6">
                                Set your organization's exact location. NGOs will see this on their live satellite map when you post food.
                            </p>
                            <form onSubmit={handleProfileSave}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-primary/80 mb-2">Full Name</label>
                                        <input value={profileForm.fullName} onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })} className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl shadow-sm border-none focus:ring-2 focus:ring-surface-tint/40" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-primary/80 mb-2">Organization Name</label>
                                        <input value={profileForm.organizationName} onChange={e => setProfileForm({ ...profileForm, organizationName: e.target.value })} placeholder="e.g., MealBridge Kitchen" className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl shadow-sm border-none focus:ring-2 focus:ring-surface-tint/40" />
                                    </div>
                                </div>

                                {/* Location Picker — key forces remount when profile location loads */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-primary/80 mb-3">
                                        📍 Organization Location <span className="text-secondary font-bold">(search or click on map)</span>
                                    </label>
                                    {profile?.address && (
                                        <div className="mb-3 px-4 py-3 rounded-xl bg-primary-fixed text-primary-container text-sm font-semibold flex items-center gap-2">
                                            ✅ Current location: <span className="font-normal opacity-80">{profile.address.split(',').slice(0, 3).join(',')}</span>
                                        </div>
                                    )}
                                    <LocationPicker
                                        key={profileLocation.address || 'no-location'}
                                        initialLat={profileLocation.lat}
                                        initialLng={profileLocation.lng}
                                        initialAddress={profileLocation.address}
                                        onLocationChange={loc => setProfileLocation(loc)}
                                    />
                                </div>

                                {profileMsg && (
                                    <div className={`px-4 py-3 rounded-xl text-sm font-medium mb-4 ${profileMsg.startsWith('Error') ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-primary-container'}`}>
                                        {profileMsg}
                                    </div>
                                )}
                                <button type="submit" disabled={saving} className="impact-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-60">
                                    {saving ? 'Saving...' : 'Save Profile & Location'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DonorDashboard;
