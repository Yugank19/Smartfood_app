import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LocationPicker from '../components/LocationPicker';

const DonorDashboard = () => {
    const [stats, setStats] = useState({ mealsShared: 0, co2OffsetTons: 0, activeListings: 0 });
    const [myListings, setMyListings] = useState([]);
    const [activePickups, setActivePickups] = useState([]); // food claimed by NGOs, in progress
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [postForm, setPostForm] = useState({ foodType: '', quantity: '', preparationTime: '', expiryTime: '' });
    const [postLocation, setPostLocation] = useState({ lat: null, lng: null, address: '' });
    const [postMsg, setPostMsg] = useState('');
    const [profileForm, setProfileForm] = useState({ fullName: '', organizationName: '' });
    const [profileLocation, setProfileLocation] = useState({ lat: null, lng: null, address: '' });
    const [profileMsg, setProfileMsg] = useState('');
    const [saving, setSaving] = useState(false);
    const [deliveryNote, setDeliveryNote] = useState('');
    const [confirmingId, setConfirmingId] = useState(null); // which pickup is being confirmed
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, listingsRes, profileRes, activePickupsRes] = await Promise.all([
                axios.get('http://localhost:8080/api/food/my-stats', authHeader),
                axios.get('http://localhost:8080/api/food/my-listings', authHeader),
                axios.get('http://localhost:8080/api/profile', authHeader),
                axios.get('http://localhost:8080/api/pickups/donor-active', authHeader),
            ]);
            setStats(statsRes.data);
            setMyListings(listingsRes.data);
            setActivePickups(activePickupsRes.data);
            const p = profileRes.data;
            setProfile(p);
            setProfileForm({ fullName: p.fullName || '', organizationName: p.organizationName || '' });
            setProfileLocation({ lat: p.latitude || null, lng: p.longitude || null, address: p.address || '' });
            // Pre-fill post form location from profile
            if (p.address) {
                setPostLocation({ lat: p.latitude || null, lng: p.longitude || null, address: p.address });
            }
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.clear(); navigate('/login');
            }
        } finally { setLoading(false); }
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handlePost = async (e) => {
        e.preventDefault();
        if (!postLocation.address) {
            setPostMsg('Error: Please set a pickup location on the map.');
            return;
        }
        setPostMsg('');
        setSaving(true);
        try {
            const payload = {
                ...postForm,
                location: postLocation.address,
                latitude: postLocation.lat,
                longitude: postLocation.lng,
            };
            await axios.post('http://localhost:8080/api/food/list', payload, authHeader);
            setPostMsg('✓ Donation posted and visible on the NGO map!');
            setPostForm({ foodType: '', quantity: '', preparationTime: '', expiryTime: '' });
            setActiveTab('overview');
            fetchData();
        } catch (err) {
            setPostMsg('Error: ' + (err.response?.data?.message || 'Could not post donation.'));
        } finally { setSaving(false); }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        if (!profileLocation.address) {
            setProfileMsg('Error: Please set your location on the map.');
            return;
        }
        setProfileMsg('');
        setSaving(true);
        try {
            const payload = {
                ...profileForm,
                address: profileLocation.address,
                latitude: profileLocation.lat?.toString(),
                longitude: profileLocation.lng?.toString(),
            };
            const res = await axios.patch('http://localhost:8080/api/profile', payload, authHeader);
            setProfile(res.data);
            setProfileMsg(`✓ Profile saved! Your location is now visible on the NGO map.`);
            fetchData();
        } catch (err) {
            setProfileMsg('Error: ' + (err.response?.data?.message || 'Could not save profile.'));
        } finally { setSaving(false); }
    };

    const handleConfirmDelivery = async (pickupId) => {
        setSaving(true);
        try {
            await axios.patch(
                `http://localhost:8080/api/pickups/${pickupId}/donor-confirm-delivery`,
                { note: deliveryNote },
                authHeader
            );
            setConfirmingId(null);
            setDeliveryNote('');
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.message || 'Could not confirm delivery.'));
        } finally { setSaving(false); }
    };

    const statusColor = (s) => {
        const map = { AVAILABLE: '#acf847', ACCEPTED: '#FEF3C7', PICKED_UP: '#DBEAFE', DELIVERED: '#b0f0d6', EXPIRED: '#E5E7EB', CANCELLED: '#FEE2E2' };
        return map[s] || '#E5E7EB';
    };

    return (
        <div className="flex min-h-screen bg-surface">
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

                {/* ── OVERVIEW TAB ── */}
                {activeTab === 'overview' && (
                    <>
                        {!profile?.latitude && !loading && (
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
                                                    <div className="p-3 flex justify-end">
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
                                    {myListings.map(listing => (
                                        <div key={listing.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center shadow-sm">
                                                    <span className="text-lg">🍽</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold">{listing.foodType}</p>
                                                    <p className="text-on-surface-variant text-sm">{listing.quantity} · {listing.location?.split(',').slice(0, 2).join(',')}</p>
                                                    {listing.latitude && <p className="text-xs text-secondary font-bold mt-1">📍 Visible on NGO map</p>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-on-surface-variant text-xs font-bold mb-1">
                                                    {new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </p>
                                                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full" style={{ background: statusColor(listing.status), color: '#003527' }}>
                                                    {listing.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
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

                                {/* Location Picker */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-primary/80 mb-3">
                                        📍 Pickup Location <span className="text-secondary font-bold">(search or click on map)</span>
                                    </label>
                                    <LocationPicker
                                        initialLat={postLocation.lat}
                                        initialLng={postLocation.lng}
                                        initialAddress={postLocation.address}
                                        onLocationChange={loc => setPostLocation(loc)}
                                    />
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
                                        <input value={profileForm.organizationName} onChange={e => setProfileForm({ ...profileForm, organizationName: e.target.value })} placeholder="e.g., Green Harvest Hotel" className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl shadow-sm border-none focus:ring-2 focus:ring-surface-tint/40" />
                                    </div>
                                </div>

                                {/* Location Picker */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-primary/80 mb-3">
                                        📍 Organization Location <span className="text-secondary font-bold">(search or click on map)</span>
                                    </label>
                                    <LocationPicker
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
