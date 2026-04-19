import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import useFirebaseOtp from '../hooks/useFirebaseOtp';

/**
 * LoginPage — Phone + PIN login.
 * Firebase is NOT used for login (only for registration verification).
 * Login uses phone + PIN directly against our backend.
 */
const LoginPage = () => {
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!phone.trim()) { setError('Please enter your phone number.'); return; }
        if (pin.length !== 6 || !/^\d{6}$/.test(pin)) { setError('PIN must be exactly 6 numeric digits.'); return; }
        setLoading(true);
        setError('');
        try {
            // Normalize phone: keep last 10 digits
            const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
            const response = await axios.post('http://localhost:8080/api/auth/login', {
                phone: normalizedPhone, pin
            });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('phone', response.data.phone);
            const role = response.data.role;
            if (role === 'ROLE_DONOR') navigate('/donor');
            else if (role === 'ROLE_NGO') navigate('/ngo');
            else if (role === 'ROLE_VOLUNTEER') navigate('/volunteer');
            else if (role === 'ROLE_ADMIN') navigate('/admin');
            else navigate('/');
        } catch (err) {
            const msg = err.response?.data?.message || '';
            setError(msg.includes('suspended')
                ? 'Your account has been suspended. Contact support.'
                : 'Invalid phone number or PIN. Please try again.');
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen overflow-hidden">
            {/* Left Side: Visual */}
            <section className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-primary">
                <div className="absolute inset-0 z-0">
                    <img
                        className="w-full h-full object-cover opacity-60 mix-blend-luminosity scale-110"
                        alt="Fresh organic vegetables"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoqza7idyer71qOhVzv16NNlHowiIn4XlgEWiTdx93_IKfZTEGWmae5_OK9FOpbLU57znzEkX6ADYELT1RIpIdLYhqhHngrV8ijZDu5tjdTtFa-18o_lu_WKt_gTJgM4HQUZwzAqIDzHAKeFsZ860wqG8K30qtb1old8yppYPb2dxJGzXU3GEv-CTPYH_lS9phJxqjRvHHuW2ubmWvqrtoi_yDzihn5pE-ujPpo1Q3h7FOnmBG5ZdbpkL1uRBgKED9O40AUdAr5n0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent"></div>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <span className="p-2 bg-secondary-fixed rounded-xl text-on-secondary-fixed shadow-lg">
                            <span className="material-symbols-outlined block" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                        </span>
                        <span className="text-xl font-black text-white tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>The Living Network</span>
                    </div>
                </div>
                <div className="relative z-10 mb-12">
                    <blockquote className="max-w-md">
                        <p className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            "Sustainable redistribution isn't just logistics—it's an act of collective intelligence."
                        </p>
                        <footer className="flex items-center gap-4">
                            <div className="h-[2px] w-8 bg-secondary-fixed"></div>
                            <cite className="text-secondary-fixed font-semibold not-italic tracking-wider uppercase text-xs">
                                Elena Vance, Logistics Lead
                            </cite>
                        </footer>
                    </blockquote>
                </div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
            </section>

            {/* Right Side: Login Form */}
            <section className="w-full lg:w-1/2 flex items-center justify-center bg-surface p-6 sm:p-12 md:p-24">
                <div className="w-full max-w-md">
                    <header className="mb-10">
                        <h1 className="text-4xl font-extrabold text-primary mb-2 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            Welcome Back
                        </h1>
                        <p className="text-on-surface-variant font-medium">Access your global logistics dashboard</p>
                    </header>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-primary/80 ml-1" htmlFor="phone">
                                Phone Number
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                placeholder="e.g. 9876543210"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full px-5 py-4 bg-surface-container-lowest border-none rounded-xl shadow-sm focus:ring-2 focus:ring-surface-tint/40 text-on-surface transition-all"
                                style={{ outline: 'none' }}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="block text-sm font-semibold text-primary/80" htmlFor="pin">
                                    6-Digit PIN
                                </label>
                                <Link to="/register" className="text-sm font-bold text-secondary hover:text-on-secondary-container transition-colors" style={{ textDecoration: 'none' }}>
                                    New user? Register
                                </Link>
                            </div>
                            <input
                                id="pin"
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="••••••"
                                value={pin}
                                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full px-5 py-4 bg-surface-container-lowest border-none rounded-xl shadow-sm focus:ring-2 focus:ring-surface-tint/40 text-on-surface transition-all text-center tracking-[0.5em] text-xl font-bold"
                                style={{ outline: 'none' }}
                            />
                        </div>

                        {error && (
                            <div className="px-4 py-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full primary-gradient text-white font-extrabold py-4 rounded-xl shadow-xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                            style={{ fontFamily: 'Manrope, sans-serif', opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? 'Signing in...' : 'Sign In to Dashboard'}
                        </button>
                    </form>

                    <div className="mt-10 mb-8 flex items-center gap-4">
                        <div className="flex-grow h-[1px] bg-outline-variant/20"></div>
                        <span className="text-xs font-bold text-outline uppercase tracking-widest">Secure Login</span>
                        <div className="flex-grow h-[1px] bg-outline-variant/20"></div>
                    </div>

                    <div className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-lowest border border-outline-variant/10 rounded-xl">
                        <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                        <span className="text-sm font-medium text-on-surface-variant">PIN-protected · Firebase verified · SSL encrypted</span>
                    </div>

                    <footer className="mt-12 text-center">
                        <p className="text-on-surface-variant font-medium">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-secondary font-bold hover:underline ml-1" style={{ textDecoration: 'none' }}>
                                Register with Firebase OTP
                            </Link>
                        </p>
                    </footer>
                </div>
            </section>
        </main>
    );
};

export default LoginPage;
