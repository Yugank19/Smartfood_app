import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from './config';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DonorDashboard from './pages/DonorDashboard';
import NGOFeed from './pages/NGOFeed';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LogisticsTracking from './pages/LogisticsTracking';
import AddFoodListing from './pages/AddFoodListing';
import SettingsPage from './pages/SettingsPage';
import NearbyFoodFeed from './pages/NearbyFoodFeed';
import ImpactReports from './pages/ImpactReports';
import DonorInventory from './pages/DonorInventory';
import RoleSelection from './pages/RoleSelection';
import ProfilePage from './pages/ProfilePage';

const PrivateRoute = ({ children }) => {
    const token = sessionStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

// ── User Avatar Dropdown ──────────────────────────────────────────────────────
const UserMenu = ({ userPhone, userRole, onLogout }) => {
    const [open, setOpen] = useState(false);
    const [profile, setProfile] = useState(null);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    const roleLabel = {
        ROLE_DONOR: 'Donor', ROLE_NGO: 'NGO', ROLE_VOLUNTEER: 'Volunteer',
        ROLE_ADMIN: 'Admin', ROLE_ANIMAL_CARE: 'Animal Care'
    }[userRole] || userRole;

    const roleColor = {
        ROLE_DONOR: '#003527', ROLE_NGO: '#416900', ROLE_VOLUNTEER: '#1A73E8',
        ROLE_ADMIN: '#DC2626', ROLE_ANIMAL_CARE: '#92400E'
    }[userRole] || '#6B7280';

    const dashboardPath = {
        ROLE_DONOR: '/donor', ROLE_NGO: '/ngo', ROLE_VOLUNTEER: '/volunteer', ROLE_ADMIN: '/admin'
    }[userRole] || '/';

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (token && userPhone) {
            axios.get(`${API_BASE_URL}/api/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(r => setProfile(r.data)).catch(() => {});
        }
    }, [userPhone]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const initials = profile?.fullName
        ? profile.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : userPhone?.slice(-2) || '??';

    return (
        <div ref={menuRef} style={{ position: 'relative' }}>
            {/* Avatar button */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'none', border: '2px solid #E5E7EB',
                    borderRadius: '100px', padding: '6px 14px 6px 6px',
                    cursor: 'pointer', transition: 'all 0.2s',
                    backgroundColor: open ? '#F0FDF4' : 'white',
                }}
            >
                {/* Avatar circle */}
                <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)`,
                    color: 'white', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem',
                    flexShrink: 0
                }}>
                    {initials}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem', color: '#003527', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {profile?.fullName || userPhone}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: roleColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {roleLabel}
                    </p>
                </div>
                <svg style={{ width: '14px', height: '14px', color: '#9CA3AF', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'white', borderRadius: '16px', minWidth: '240px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.15)', border: '1px solid #E5E7EB',
                    zIndex: 9999, overflow: 'hidden'
                }}>
                    {/* Profile header */}
                    <div style={{ padding: '16px', background: 'linear-gradient(135deg, #003527, #064e3b)', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.2)', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '1rem', border: '2px solid rgba(255,255,255,0.3)'
                            }}>
                                {initials}
                            </div>
                            <div>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem' }}>{profile?.fullName || 'User'}</p>
                                <p style={{ margin: '2px 0 0', fontSize: '0.7rem', opacity: 0.8 }}>{userPhone}</p>
                                {profile?.trustScore != null && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>
                                            ⭐ {profile.trustScore?.toFixed(1)} Trust Score
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '8px' }}>
                        {[
                            { icon: '👤', label: 'My Profile', action: () => { navigate('/profile'); setOpen(false); } },
                            { icon: '🏠', label: 'Dashboard', action: () => { navigate(dashboardPath); setOpen(false); } },
                            { icon: '⚙️', label: 'Settings', action: () => { navigate('/settings'); setOpen(false); } },
                        ].map((item, i) => (
                            <button
                                key={i}
                                onClick={item.action}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '10px 12px', borderRadius: '10px', border: 'none',
                                    background: 'none', cursor: 'pointer', textAlign: 'left',
                                    fontSize: '0.875rem', fontWeight: 600, color: '#003527',
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#F0FDF4'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}

                        <div style={{ height: '1px', background: '#E5E7EB', margin: '6px 0' }} />

                        <button
                            onClick={() => { onLogout(); setOpen(false); }}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '10px 12px', borderRadius: '10px', border: 'none',
                                background: 'none', cursor: 'pointer', textAlign: 'left',
                                fontSize: '0.875rem', fontWeight: 700, color: '#DC2626',
                                transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                            <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>🚪</span>
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Navbar = ({ userPhone, onLogout, userRole }) => (
    <header className="glass-nav sticky top-0 z-50 flex items-center justify-between px-10 py-4 border-b border-outline-variant/15">
        <div className="flex items-center gap-4 text-primary">
            <div className="w-8 h-8">
                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" />
                </svg>
            </div>
            <Link to="/" style={{ textDecoration: 'none' }}>
                <h2 className="text-on-surface text-xl font-headline font-extrabold tracking-tight">The Living Network</h2>
            </Link>
        </div>
        <div className="flex flex-1 justify-end gap-12 items-center">
            {!userPhone && (
                <nav className="hidden md:flex items-center gap-10">
                    <Link to="/impact" className="text-on-surface text-sm font-semibold hover:text-secondary transition-colors" style={{ textDecoration: 'none' }}>Impact</Link>
                    <Link to="/nearby" className="text-on-surface text-sm font-semibold hover:text-secondary transition-colors" style={{ textDecoration: 'none' }}>Nearby Feed</Link>
                    <a className="text-on-surface text-sm font-semibold hover:text-secondary transition-colors" href="#">How it Works</a>
                    <a className="text-on-surface text-sm font-semibold hover:text-secondary transition-colors" href="#">Mission</a>
                </nav>
            )}
            {userPhone ? (
                <UserMenu userPhone={userPhone} userRole={userRole} onLogout={onLogout} />
            ) : (
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-on-surface text-sm font-semibold hover:text-secondary transition-colors" style={{ textDecoration: 'none' }}>
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="flex min-w-[120px] items-center justify-center rounded-lg h-11 px-6 impact-gradient text-on-primary text-sm font-bold tracking-wide shadow-lg shadow-primary/10"
                        style={{ textDecoration: 'none' }}
                    >
                        Join the Network
                    </Link>
                </div>
            )}
        </div>
    </header>
);

const AppContent = () => {
    const [userPhone, setUserPhone] = useState(sessionStorage.getItem('phone'));
    const [userRole, setUserRole] = useState(sessionStorage.getItem('role'));
    const [userToken, setUserToken] = useState(sessionStorage.getItem('token'));
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            const phone = sessionStorage.getItem('phone');
            const role = sessionStorage.getItem('role');
            const token = sessionStorage.getItem('token');
            
            // If phone exists but token doesn't, it's a stale/invalid session
            if (phone && !token) {
                sessionStorage.clear();
                setUserPhone(null);
                setUserRole(null);
                setUserToken(null);
                return;
            }

            if (phone !== userPhone) setUserPhone(phone);
            if (role !== userRole) setUserRole(role);
            if (token !== userToken) setUserToken(token);
        }, 500);
        return () => clearInterval(interval);
    }, [userPhone, userRole, userToken]);

    const handleLogout = () => {
        sessionStorage.clear();
        setUserPhone(null);
        setUserRole(null);
        setUserToken(null);
        navigate('/');
    };

    const isAuthenticated = !!userToken && !!userPhone;

    return (
        <div className="App">
            <Navbar userPhone={isAuthenticated ? userPhone : null} userRole={userRole} onLogout={handleLogout} />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/donor" element={<PrivateRoute><DonorDashboard /></PrivateRoute>} />
                <Route path="/ngo" element={<PrivateRoute><NGOFeed /></PrivateRoute>} />
                <Route path="/volunteer" element={<PrivateRoute><VolunteerDashboard /></PrivateRoute>} />
                <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
                
                <Route path="/logistics" element={<PrivateRoute><LogisticsTracking /></PrivateRoute>} />
                <Route path="/add-food" element={<PrivateRoute><AddFoodListing /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
                <Route path="/nearby" element={<NearbyFoodFeed />} />
                <Route path="/impact" element={<ImpactReports />} />
                <Route path="/inventory" element={<PrivateRoute><DonorInventory /></PrivateRoute>} />
                <Route path="/role-selection" element={<PrivateRoute><RoleSelection /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            </Routes>
        </div>
    );
};


const App = () => (
    <Router>
        <AppContent />
    </Router>
);

export default App;
