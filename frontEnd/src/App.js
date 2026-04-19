import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
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

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
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
                <div className="flex items-center gap-6">
                    <Link
                        to={userRole === 'ROLE_DONOR' ? '/donor' : userRole === 'ROLE_NGO' ? '/ngo' : userRole === 'ROLE_VOLUNTEER' ? '/volunteer' : '/admin'}
                        className="text-on-surface text-sm font-semibold hover:text-secondary transition-colors"
                        style={{ textDecoration: 'none' }}
                    >
                        Dashboard
                    </Link>
                    <Link to="/settings" className="text-on-surface text-sm font-semibold hover:text-secondary transition-colors" style={{ textDecoration: 'none' }}>Settings</Link>
                    <button
                        onClick={onLogout}
                        className="flex min-w-[120px] items-center justify-center rounded-lg h-11 px-6 impact-gradient text-on-primary text-sm font-bold tracking-wide shadow-lg shadow-primary/10"
                    >
                        Logout
                    </button>
                </div>
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
    const [userPhone, setUserPhone] = useState(localStorage.getItem('phone'));
    const [userRole, setUserRole] = useState(localStorage.getItem('role'));
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            const phone = localStorage.getItem('phone');
            const role = localStorage.getItem('role');
            if (phone !== userPhone) setUserPhone(phone);
            if (role !== userRole) setUserRole(role);
        }, 500);
        return () => clearInterval(interval);
    }, [userPhone, userRole]);

    const handleLogout = () => {
        localStorage.clear();
        setUserPhone(null);
        setUserRole(null);
        navigate('/');
    };

    return (
        <div className="App">
            <Navbar userPhone={userPhone} userRole={userRole} onLogout={handleLogout} />
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
