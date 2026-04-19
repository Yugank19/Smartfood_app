import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import useFirebaseOtp from '../hooks/useFirebaseOtp';

const STEPS = ['Phone', 'Verify OTP', 'Your Details', 'Set PIN'];

const StepIndicator = ({ current }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem' }}>
        {STEPS.map((label, i) => (
            <React.Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: i < current ? '#064E3B' : i === current ? '#F59E0B' : '#E5E7EB',
                        color: i <= current ? 'white' : '#9CA3AF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.3s'
                    }}>
                        {i < current ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: i === current ? '#064E3B' : '#9CA3AF', whiteSpace: 'nowrap' }}>
                        {label}
                    </span>
                </div>
                {i < STEPS.length - 1 && (
                    <div style={{ height: '2px', width: '60px', background: i < current ? '#064E3B' : '#E5E7EB', marginBottom: '20px', transition: 'all 0.3s' }} />
                )}
            </React.Fragment>
        ))}
    </div>
);

const RegisterPage = () => {
    const [step, setStep] = useState(0);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [profile, setProfile] = useState({ fullName: '', role: 'DONOR', organizationName: '', address: '' });
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const firebase = useFirebaseOtp();

    // ── Step 1: Send OTP via Firebase ─────────────────────────────────────────
    const handleSendOtp = async () => {
        if (!phone.trim()) { setError('Please enter your mobile number.'); return; }
        setError('');
        setLoading(true);
        const success = await firebase.sendOtp(phone, 'recaptcha-container');
        setLoading(false);
        if (success) {
            setStep(1);
        } else {
            setError(firebase.error || 'Failed to send OTP. Please try again.');
        }
    };

    // ── Step 2: Verify OTP via Firebase ──────────────────────────────────────
    const handleVerifyOtp = async () => {
        if (!otp.trim() || otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
        setError('');
        setLoading(true);
        const idToken = await firebase.verifyOtp(otp);
        setLoading(false);
        if (idToken) {
            // Tell backend the phone is verified
            try {
                await axios.post('http://localhost:8080/api/auth/firebase/verify-phone', { idToken });
                setStep(2);
            } catch (err) {
                setError(err.response?.data?.message || 'Verification failed. Please try again.');
            }
        } else {
            setError(firebase.error || 'Invalid OTP. Please try again.');
        }
    };

    // ── Step 3: Profile details ───────────────────────────────────────────────
    const handleProfileNext = () => {
        if (!profile.fullName.trim()) { setError('Full name is required.'); return; }
        if ((profile.role === 'DONOR' || profile.role === 'NGO') && !profile.organizationName.trim()) {
            setError('Organization name is required for Donor and NGO roles.'); return;
        }
        setError('');
        setStep(3);
    };

    // ── Step 4: Register + auto-login ─────────────────────────────────────────
    const handleRegister = async () => {
        if (pin.length !== 6 || !/^\d{6}$/.test(pin)) { setError('PIN must be exactly 6 numeric digits.'); return; }
        if (pin !== confirmPin) { setError('PINs do not match.'); return; }
        setLoading(true); setError('');
        try {
            // Normalize phone for backend (strip country code)
            const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
            await axios.post('http://localhost:8080/api/auth/register', {
                phone: normalizedPhone, ...profile, pin
            });
            const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
                phone: normalizedPhone, pin
            });
            localStorage.setItem('token', loginRes.data.token);
            localStorage.setItem('role', loginRes.data.role);
            localStorage.setItem('phone', loginRes.data.phone);
            const role = loginRes.data.role;
            if (role === 'ROLE_DONOR') navigate('/donor');
            else if (role === 'ROLE_NGO') navigate('/ngo');
            else if (role === 'ROLE_VOLUNTEER') navigate('/volunteer');
            else navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please check your details.');
        } finally { setLoading(false); }
    };

    const cardStyle = {
        background: 'white', borderRadius: '16px', padding: '2.5rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB'
    };
    const inputStyle = {
        width: '100%', padding: '0.875rem 1rem', borderRadius: '10px',
        border: '1.5px solid #E5E7EB', fontSize: '1rem', outline: 'none',
        background: '#f9fafb', boxSizing: 'border-box', transition: 'border-color 0.2s'
    };
    const btnPrimary = {
        width: '100%', padding: '1rem', borderRadius: '10px', border: 'none',
        background: 'linear-gradient(135deg, #003527 0%, #064e3b 100%)',
        color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
        transition: 'opacity 0.2s'
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1rem 2rem' }}>
            {/* Invisible reCAPTCHA container — required by Firebase */}
            <div id="recaptcha-container"></div>

            <div style={{ width: '100%', maxWidth: '520px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', color: '#003527', marginBottom: '0.5rem', fontFamily: 'Manrope, sans-serif' }}>
                        Join the Mission
                    </h1>
                    <p style={{ color: '#6B7280' }}>Create your account in 4 simple steps.</p>
                </div>

                <StepIndicator current={step} />

                <div style={cardStyle}>
                    {error && (
                        <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.875rem 1rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1.5rem', fontWeight: 500 }}>
                            {error}
                        </div>
                    )}

                    {/* ── STEP 0: Phone ── */}
                    {step === 0 && (
                        <div>
                            <h3 style={{ marginBottom: '0.5rem', color: '#003527' }}>Enter your mobile number</h3>
                            <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                We'll send a verification code via SMS using Firebase.
                            </p>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#003527' }}>
                                    Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    placeholder="e.g., 9876543210 or +919876543210"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                                    style={inputStyle}
                                />
                                <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.4rem' }}>
                                    Indian numbers: enter 10 digits. International: include country code (+1, +44, etc.)
                                </p>
                            </div>
                            <button onClick={handleSendOtp} disabled={loading || firebase.loading} style={{ ...btnPrimary, opacity: (loading || firebase.loading) ? 0.6 : 1 }}>
                                {loading || firebase.loading ? '⏳ Sending OTP...' : 'Send Verification Code →'}
                            </button>
                        </div>
                    )}

                    {/* ── STEP 1: OTP ── */}
                    {step === 1 && (
                        <div>
                            <h3 style={{ marginBottom: '0.5rem', color: '#003527' }}>Verify your number</h3>
                            <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                Enter the 6-digit code sent to <strong>{phone}</strong>.{' '}
                                <span onClick={() => { setStep(0); setOtp(''); firebase.reset(); }} style={{ color: '#F59E0B', cursor: 'pointer', fontWeight: 600 }}>
                                    Change
                                </span>
                            </p>
                            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#065F46', fontWeight: 600 }}>
                                🔥 OTP sent via Firebase SMS to {phone}
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#003527' }}>
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    maxLength="6"
                                    placeholder="000000"
                                    value={otp}
                                    inputMode="numeric"
                                    style={{ ...inputStyle, textAlign: 'center', letterSpacing: '10px', fontSize: '1.75rem', fontWeight: 'bold' }}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                            </div>
                            <button onClick={handleVerifyOtp} disabled={loading || firebase.loading} style={{ ...btnPrimary, opacity: (loading || firebase.loading) ? 0.6 : 1 }}>
                                {loading || firebase.loading ? '⏳ Verifying...' : 'Verify Code →'}
                            </button>
                            <button
                                onClick={async () => { setOtp(''); firebase.reset(); await handleSendOtp(); }}
                                disabled={loading || firebase.loading}
                                style={{ width: '100%', marginTop: '0.75rem', padding: '0.875rem', borderRadius: '10px', border: '1.5px solid #E5E7EB', background: 'transparent', color: '#6B7280', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Resend Code
                            </button>
                        </div>
                    )}

                    {/* ── STEP 2: Profile ── */}
                    {step === 2 && (
                        <div>
                            <h3 style={{ marginBottom: '0.5rem', color: '#003527' }}>Tell us about yourself</h3>
                            <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Fill in your profile details.</p>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#003527' }}>Full Name</label>
                                <input style={inputStyle} placeholder="e.g., Arjun Sharma" value={profile.fullName} onChange={e => setProfile({ ...profile, fullName: e.target.value })} />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#003527' }}>Account Role</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    {['DONOR', 'NGO', 'VOLUNTEER'].map(r => (
                                        <div key={r} onClick={() => setProfile({ ...profile, role: r })} style={{
                                            padding: '0.875rem', border: '2px solid',
                                            borderColor: profile.role === r ? '#064E3B' : '#E5E7EB',
                                            borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem',
                                            fontWeight: 700, cursor: 'pointer',
                                            background: profile.role === r ? '#064E3B11' : 'white',
                                            color: profile.role === r ? '#064E3B' : '#6B7280'
                                        }}>
                                            {r === 'DONOR' ? '🍽 Donor' : r === 'NGO' ? '🤝 NGO' : '🚴 Volunteer'}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {(profile.role === 'DONOR' || profile.role === 'NGO') && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#003527' }}>
                                        Organization Name <span style={{ color: '#DC2626' }}>*</span>
                                    </label>
                                    <input style={inputStyle} placeholder="e.g., Green Harvest Group" value={profile.organizationName} onChange={e => setProfile({ ...profile, organizationName: e.target.value })} />
                                </div>
                            )}

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#003527' }}>Address</label>
                                <input style={inputStyle} placeholder="123 Main St, City" value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} />
                            </div>

                            <button onClick={handleProfileNext} style={btnPrimary}>Continue →</button>
                        </div>
                    )}

                    {/* ── STEP 3: PIN ── */}
                    {step === 3 && (
                        <div>
                            <h3 style={{ marginBottom: '0.5rem', color: '#003527' }}>Set your login PIN</h3>
                            <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                Choose a 6-digit PIN. You'll use this to log in every time.
                            </p>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#003527' }}>Create PIN</label>
                                <input
                                    type="password" maxLength="6" placeholder="••••••" value={pin} inputMode="numeric"
                                    style={{ ...inputStyle, textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 'bold' }}
                                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#003527' }}>Confirm PIN</label>
                                <input
                                    type="password" maxLength="6" placeholder="••••••" value={confirmPin} inputMode="numeric"
                                    style={{ ...inputStyle, textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 'bold', borderColor: confirmPin && pin !== confirmPin ? '#DC2626' : '#E5E7EB' }}
                                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                                {confirmPin && pin !== confirmPin && (
                                    <p style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '0.4rem' }}>PINs do not match.</p>
                                )}
                            </div>

                            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.875rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: '#065F46' }}>
                                🔒 Your PIN is encrypted and never stored in plain text.
                            </div>

                            <button
                                onClick={handleRegister}
                                disabled={loading || pin !== confirmPin || pin.length !== 6}
                                style={{ ...btnPrimary, opacity: (loading || pin !== confirmPin || pin.length !== 6) ? 0.6 : 1 }}
                            >
                                {loading ? 'Creating account...' : 'Complete Registration ✓'}
                            </button>
                        </div>
                    )}
                </div>

                <p style={{ textAlign: 'center', marginTop: '2rem', color: '#6B7280' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#064E3B', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
