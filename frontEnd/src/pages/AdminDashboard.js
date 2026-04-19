import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [activity, setActivity] = useState([]);
    const [listings, setListings] = useState([]);
    const [pickups, setPickups] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    const fetchData = useCallback(async () => {
        try {
            const [analyticsRes, usersRes, activityRes, listingsRes, pickupsRes] = await Promise.all([
                axios.get('http://localhost:8080/api/admin/analytics', authHeader),
                axios.get('http://localhost:8080/api/admin/users', authHeader),
                axios.get('http://localhost:8080/api/admin/activity', authHeader),
                axios.get('http://localhost:8080/api/admin/listings', authHeader),
                axios.get('http://localhost:8080/api/admin/pickups', authHeader),
            ]);
            setAnalytics(analyticsRes.data);
            setUsers(usersRes.data);
            setActivity(activityRes.data);
            setListings(listingsRes.data);
            setPickups(pickupsRes.data);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.clear(); navigate('/login');
            }
        } finally { setLoading(false); }
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const showMsg = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 4000); };

    const handleUserStatus = async (userId, status) => {
        try {
            await axios.patch(`http://localhost:8080/api/admin/users/${userId}/status`, { status }, authHeader);
            showMsg(`✓ User status updated to ${status}.`);
            fetchData();
        } catch (err) {
            showMsg('Error: ' + (err.response?.data?.message || 'Could not update.'));
        }
    };

    const handleVerifyOrg = async (userId) => {
        try {
            await axios.patch(`http://localhost:8080/api/admin/users/${userId}/verify`, { notes: 'Verified by admin' }, authHeader);
            showMsg('✓ Organization verified successfully.');
            fetchData();
        } catch (err) {
            showMsg('Error: ' + (err.response?.data?.message || 'Could not verify.'));
        }
    };

    const metrics = analytics ? [
        { label: 'Total Active Users', value: (analytics.activeDonors + analytics.activeNGOs + analytics.activeVolunteers).toLocaleString(), trend: '+12%', color: 'primary' },
        { label: 'NGOs Active', value: analytics.activeNGOs.toString(), trend: `+${analytics.activeNGOs}`, color: 'secondary' },
        { label: 'Meals Saved', value: analytics.totalMealsSaved.toLocaleString(), trend: '+22%', color: 'primary' },
        { label: 'Total Deliveries', value: analytics.totalDeliveries.toLocaleString(), trend: '+18%', color: 'secondary' },
    ] : [];

    const timeAgo = (ts) => {
        const diff = (new Date() - new Date(ts)) / 1000;
        if (diff < 60) return `${Math.floor(diff)}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const statusBadge = (status) => {
        const map = { ACTIVE: { bg: '#b0f0d6', color: '#003527' }, SUSPENDED: { bg: '#FEE2E2', color: '#DC2626' }, PENDING_VERIFICATION: { bg: '#FEF3C7', color: '#92400E' } };
        return map[status] || { bg: '#E5E7EB', color: '#374151' };
    };

    return (
        <div className="flex min-h-screen bg-surface">
            {/* Sidebar */}
            <aside className="w-72 sidebar min-h-screen p-8 hidden lg:block">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 rounded-xl impact-gradient flex items-center justify-center text-white shadow-lg">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                    <span className="font-headline font-bold text-xl text-primary">Living Network</span>
                </div>
                <nav className="space-y-2">
                    {[
                        { key: 'overview', label: 'System Overview' },
                        { key: 'users', label: 'User Management' },
                        { key: 'listings', label: 'Food Listings' },
                        { key: 'pickups', label: 'Pickup Requests' },
                    ].map(item => (
                        <div key={item.key}
                            onClick={() => setActiveTab(item.key)}
                            className={`p-3 px-6 cursor-pointer transition-colors font-medium rounded-full ${activeTab === item.key ? 'nav-item-active' : 'text-on-surface-variant hover:text-primary'}`}>
                            {item.label}
                        </div>
                    ))}
                    <Link to="/" className="block p-3 px-6 text-on-surface-variant hover:text-primary cursor-pointer transition-colors font-medium" style={{ textDecoration: 'none' }}>Home</Link>
                </nav>
                <div className="mt-auto pt-10">
                    <div className="bg-surface-container-highest p-6 rounded-3xl border border-outline-variant/15">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Build Version</p>
                        <p className="text-sm font-extrabold text-primary">v2.4.0-PRO</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 lg:p-12">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-slide-up">
                    <div>
                        <p className="text-secondary font-semibold text-sm uppercase tracking-widest mb-2">Administrative Console</p>
                        <h1 className="text-4xl font-headline font-extrabold text-primary">Admin Dashboard</h1>
                    </div>
                    <button onClick={fetchData} className="bg-surface-container-low text-primary px-6 py-3 rounded-xl font-bold border border-outline-variant/15 hover:bg-surface-container transition-colors">
                        Refresh Data
                    </button>
                </header>

                {message && (
                    <div className={`mb-8 px-5 py-4 rounded-xl font-semibold text-sm ${message.startsWith('Error') ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-primary-container'}`}>
                        {message}
                    </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-slide-up">
                    {loading ? Array(4).fill(0).map((_, i) => (
                        <div key={i} className="card-elevated opacity-40"><div className="h-16 bg-surface-container rounded-xl" /></div>
                    )) : metrics.map((m, idx) => (
                        <div key={idx} className="card-elevated group border-none">
                            <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest mb-2">{m.label}</p>
                            <div className="flex items-end justify-between">
                                <h3 className="text-3xl font-extrabold">{m.value}</h3>
                                <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full ${m.color === 'primary' ? 'bg-primary-fixed text-primary-container' : 'bg-secondary-container text-on-secondary-fixed-variant'}`}>
                                    {m.trend}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
                        <div className="lg:col-span-2 card-elevated">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-headline font-extrabold">System-Wide Activity</h2>
                                <div className="flex items-center gap-2 text-secondary text-sm font-bold">
                                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                    LIVE
                                </div>
                            </div>
                            <div className="space-y-4">
                                {activity.length === 0 ? (
                                    <p className="text-on-surface-variant text-center py-8">No activity yet.</p>
                                ) : activity.map((item, i) => (
                                    <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-surface hover:bg-surface-container-low transition-colors border border-outline-variant/10">
                                        <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${item.type === 'alert' ? 'bg-red-500 animate-pulse' : item.type === 'delivery' ? 'bg-secondary' : 'bg-primary'}`} />
                                        <div className="flex-1">
                                            <p className="text-on-surface font-bold mb-1">{item.action}</p>
                                            <p className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">{timeAgo(item.timestamp)} · {item.type}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <section className="card-elevated bg-primary-container text-white no-border">
                                <h3 className="text-xl font-extrabold mb-6">Platform Stats</h3>
                                <div className="space-y-4">
                                    {analytics && [
                                        { label: 'Active Donors', value: analytics.activeDonors },
                                        { label: 'Active NGOs', value: analytics.activeNGOs },
                                        { label: 'Active Volunteers', value: analytics.activeVolunteers },
                                        { label: 'Total Users', value: users.length },
                                    ].map((s, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/10">
                                            <span className="text-sm font-medium opacity-80">{s.label}</span>
                                            <span className="font-extrabold text-secondary-container">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="card-elevated animate-slide-up overflow-hidden p-0">
                        <div className="p-6 border-b border-outline-variant/15">
                            <h2 className="text-2xl font-headline font-extrabold">All Users ({users.length})</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-surface-container-low border-b border-outline-variant/15">
                                        {['Name', 'Phone', 'Role', 'Organization', 'Verified', 'Status', 'Joined', 'Actions'].map(h => (
                                            <th key={h} className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, i) => {
                                        const sc = statusBadge(user.status);
                                        return (
                                            <tr key={user.id} className={`border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container-low/30'}`}>
                                                <td className="px-6 py-4 font-bold">{user.fullName}</td>
                                                <td className="px-6 py-4 text-on-surface-variant text-sm">{user.phone}</td>
                                                <td className="px-6 py-4"><span className="text-xs font-extrabold text-secondary">{user.role}</span></td>
                                                <td className="px-6 py-4 text-on-surface-variant text-sm">{user.organizationName || '—'}</td>
                                                <td className="px-6 py-4">
                                                    {user.organizationVerified
                                                        ? <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-primary-fixed text-primary-container">✓ Verified</span>
                                                        : <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-surface-container text-on-surface-variant">Unverified</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-extrabold px-3 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>{user.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-on-surface-variant text-xs">
                                                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2 flex-wrap">
                                                        {user.status !== 'ACTIVE' && (
                                                            <button onClick={() => handleUserStatus(user.id, 'ACTIVE')} className="text-[10px] font-extrabold px-3 py-1 rounded-lg bg-primary-fixed text-primary-container hover:scale-105 transition-transform">
                                                                Approve
                                                            </button>
                                                        )}
                                                        {user.status !== 'SUSPENDED' && (
                                                            <button onClick={() => handleUserStatus(user.id, 'SUSPENDED')} className="text-[10px] font-extrabold px-3 py-1 rounded-lg bg-error-container text-on-error-container hover:scale-105 transition-transform">
                                                                Suspend
                                                            </button>
                                                        )}
                                                        {(user.role === 'DONOR' || user.role === 'NGO') && !user.organizationVerified && (
                                                            <button onClick={() => handleVerifyOrg(user.id)} className="text-[10px] font-extrabold px-3 py-1 rounded-lg bg-secondary-container text-on-secondary-fixed-variant hover:scale-105 transition-transform">
                                                                Verify Org
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Listings Tab */}
                {activeTab === 'listings' && (
                    <div className="card-elevated animate-slide-up overflow-hidden p-0">
                        <div className="p-6 border-b border-outline-variant/15">
                            <h2 className="text-2xl font-headline font-extrabold">All Food Listings ({listings.length})</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-surface-container-low border-b border-outline-variant/15">
                                        {['Food Type', 'Quantity', 'Location', 'Donor', 'Status', 'Posted'].map(h => (
                                            <th key={h} className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {listings.map((l, i) => (
                                        <tr key={l.id} className={`border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container-low/30'}`}>
                                            <td className="px-6 py-4 font-bold">{l.foodType}</td>
                                            <td className="px-6 py-4 text-on-surface-variant text-sm">{l.quantity}</td>
                                            <td className="px-6 py-4 text-on-surface-variant text-sm">{l.location}</td>
                                            <td className="px-6 py-4 text-on-surface-variant text-sm">{l.donor?.fullName || '—'}</td>
                                            <td className="px-6 py-4"><span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-surface-container text-on-surface-variant">{l.status}</span></td>
                                            <td className="px-6 py-4 text-on-surface-variant text-xs">{new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pickups Tab */}
                {activeTab === 'pickups' && (
                    <div className="card-elevated animate-slide-up overflow-hidden p-0">
                        <div className="p-6 border-b border-outline-variant/15">
                            <h2 className="text-2xl font-headline font-extrabold">All Pickup Requests ({pickups.length})</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-surface-container-low border-b border-outline-variant/15">
                                        {['#', 'Food', 'NGO', 'Volunteer', 'Status', 'Created'].map(h => (
                                            <th key={h} className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pickups.map((p, i) => (
                                        <tr key={p.id} className={`border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container-low/30'}`}>
                                            <td className="px-6 py-4 text-on-surface-variant text-xs">#{p.id}</td>
                                            <td className="px-6 py-4 font-bold">{p.foodType}</td>
                                            <td className="px-6 py-4 text-on-surface-variant text-sm">{p.ngoName}</td>
                                            <td className="px-6 py-4 text-on-surface-variant text-sm">{p.volunteerName || '—'}</td>
                                            <td className="px-6 py-4"><span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-surface-container text-on-surface-variant">{p.status}</span></td>
                                            <td className="px-6 py-4 text-on-surface-variant text-xs">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
