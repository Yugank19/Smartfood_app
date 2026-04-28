import { API_BASE_URL } from '../config';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ROLE_COLORS = {
    DONOR: '#003527', NGO: '#416900', VOLUNTEER: '#1A73E8',
    ADMIN: '#DC2626', ANIMAL_CARE: '#92400E'
};
const ROLE_LABELS = {
    DONOR: 'Food Donor', NGO: 'NGO Partner', VOLUNTEER: 'Volunteer',
    ADMIN: 'Administrator', ANIMAL_CARE: 'Animal Care'
};

const StarRating = ({ score, size = 16 }) => (
    <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(i => (
            <span key={i} style={{ fontSize: size, color: i <= score ? '#F59E0B' : '#E5E7EB' }}>★</span>
        ))}
    </div>
);

const TrustScoreRing = ({ score }) => {
    const pct = Math.min(score / 10, 1);
    const r = 40, cx = 50, cy = 50;
    const circ = 2 * Math.PI * r;
    const dash = pct * circ;
    const color = score >= 7 ? '#416900' : score >= 4 ? '#F59E0B' : '#DC2626';
    return (
        <div style={{ position: 'relative', width: 100, height: 100 }}>
            <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1.4rem', color, lineHeight: 1 }}>{score?.toFixed(1)}</span>
                <span style={{ fontSize: '0.55rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trust</span>
            </div>
        </div>
    );
};

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({ fullName: '', organizationName: '' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    const token = sessionStorage.getItem('token');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    const fetchProfile = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/profile/me/full`, authHeader);
            setProfile(res.data);
            setEditForm({ fullName: res.data.fullName || '', organizationName: res.data.organizationName || '' });
        } catch (err) {
            if (err.response?.status === 401) { sessionStorage.clear(); navigate('/login'); }
        } finally { setLoading(false); }
    }, [token]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.patch(`${API_BASE_URL}/api/profile`, editForm, authHeader);
            setMsg('✓ Profile updated!');
            setEditMode(false);
            fetchProfile();
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setMsg('Error: ' + (err.response?.data?.message || 'Could not save.'));
        } finally { setSaving(false); }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9ff' }}>
            <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
                <p>Loading profile...</p>
            </div>
        </div>
    );

    if (!profile) return null;

    const roleColor = ROLE_COLORS[profile.role] || '#6B7280';
    const roleLabel = ROLE_LABELS[profile.role] || profile.role;
    const initials = profile.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
    const memberSince = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';

    const tabs = [
        { key: 'overview', label: '📊 Overview' },
        { key: 'ratings', label: `⭐ Reviews (${profile.ratingsReceived?.length || 0})` },
        ...(profile.ratingsGiven?.length > 0 ? [{ key: 'given', label: `📝 Given (${profile.ratingsGiven.length})` }] : []),
        { key: 'edit', label: '✏️ Edit Profile' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9ff', paddingBottom: '4rem' }}>
            {/* Hero banner */}
            <div style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)`, padding: '7rem 2rem 7rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'absolute', bottom: '-60px', left: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
                    {/* Avatar */}
                    <div style={{
                        width: '140px', height: '140px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)', border: '4px solid rgba(255,255,255,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '3.5rem', fontWeight: 800, color: 'white', flexShrink: 0,
                        boxShadow: '0 12px 32px rgba(0,0,0,0.15)'
                    }}>
                        {initials}
                    </div>
                    <div style={{ color: 'white', flex: 1, minWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            <h1 style={{ margin: 0, fontFamily: 'Manrope,sans-serif', fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                {profile.fullName}
                            </h1>
                            {profile.organizationVerified && (
                                <span style={{ background: '#acf847', color: '#003527', padding: '6px 14px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    ✓ VERIFIED
                                </span>
                            )}
                        </div>
                        <p style={{ margin: '0 0 16px', opacity: 0.95, fontSize: '1.25rem', fontWeight: 600 }}>
                            {roleLabel} {profile.organizationName ? `· ${profile.organizationName}` : ''}
                        </p>
                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', opacity: 0.85, fontSize: '0.9rem', fontWeight: 600 }}>
                            {profile.address && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>location_on</span> {profile.address.split(',').slice(0, 2).join(',')}</span>}
                            {memberSince && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_today</span> Member since {memberSince}</span>}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call</span> {profile.phone}</span>
                        </div>
                    </div>
                    {/* Trust score ring card */}
                    <div style={{ background: 'white', borderRadius: '28px', padding: '24px 28px', textAlign: 'center', minWidth: '150px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <TrustScoreRing score={profile.trustScore || 5} />
                        <p style={{ margin: '12px 0 0', fontSize: '0.8rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Trust Score
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats bar */}
            <div style={{ maxWidth: '1000px', margin: '-4rem auto 0', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
                <div style={{
                    background: 'white', borderRadius: '28px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)'
                }}>
                    {[
                        { label: 'Deliveries', value: profile.totalDeliveries || 0, icon: '🚚', color: '#003527' },
                        { label: 'Avg Rating', value: profile.averageRating > 0 ? `${profile.averageRating}/5` : 'N/A', icon: '⭐', color: '#F59E0B' },
                        { label: 'Reviews', value: profile.totalRatings || 0, icon: '💬', color: '#1A73E8' },
                        { label: 'Completion', value: `${profile.completionRate || 100}%`, icon: '✅', color: '#416900' },
                        { label: 'Status', value: profile.status, icon: profile.status === 'ACTIVE' ? '🟢' : '🔴', color: profile.status === 'ACTIVE' ? '#416900' : '#DC2626' },
                    ].map((s, i) => (
                        <div key={i} style={{
                            padding: '1.75rem 1rem', textAlign: 'center',
                            borderRight: i < 4 ? '1px solid #F3F4F6' : 'none',
                            background: 'white'
                        }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{s.icon}</div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem', color: s.color }}>{s.value}</p>
                            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs + Content */}
            <div style={{ maxWidth: '1000px', margin: '4rem auto 0', padding: '0 1.5rem' }}>
                {/* Tab bar */}
                <div style={{ display: 'flex', gap: '8px', background: 'white', borderRadius: '16px', padding: '6px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => { setActiveTab(t.key); if (t.key !== 'edit') setEditMode(false); else setEditMode(true); }}
                            style={{
                                padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s',
                                background: activeTab === t.key ? '#003527' : 'transparent',
                                color: activeTab === t.key ? 'white' : '#6B7280',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {msg && (
                    <div style={{ padding: '16px 20px', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 700, fontSize: '0.9rem', background: msg.startsWith('Error') ? '#FEE2E2' : '#F0FDF4', color: msg.startsWith('Error') ? '#DC2626' : '#065F46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined">{msg.startsWith('Error') ? 'error' : 'check_circle'}</span>
                        {msg}
                    </div>
                )}

                {/* Overview tab */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* About card */}
                        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', gridColumn: '1 / -1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px', fontWeight: 'bold' }}>person</span>
                                <h3 style={{ margin: 0, fontFamily: 'Manrope,sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#003527' }}>Personal Information</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
                                {[
                                    { label: 'Full Name', value: profile.fullName, icon: 'badge' },
                                    { label: 'Role', value: roleLabel, icon: 'work' },
                                    { label: 'Organization', value: profile.organizationName || '—', icon: 'corporate_fare' },
                                    { label: 'Phone', value: profile.phone, icon: 'call' },
                                    { label: 'Address', value: profile.address || '—', icon: 'location_on' },
                                    { label: 'Account Status', value: profile.status, icon: 'verified_user' },
                                    { label: 'Org Verified', value: profile.organizationVerified ? '✓ Verified' : 'Not verified', icon: 'check_circle' },
                                    { label: 'Member Since', value: memberSince, icon: 'event' },
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003527' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
                                        </div>
                                        <div>
                                            <p style={{ margin: '0 0 2px', fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                                            <p style={{ margin: 0, fontWeight: 700, color: '#003527', fontSize: '1rem' }}>{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Trust score breakdown */}
                        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px', fontWeight: 'bold' }}>analytics</span>
                                <h3 style={{ margin: 0, fontFamily: 'Manrope,sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#003527' }}>Trust Score Breakdown</h3>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                                <TrustScoreRing score={profile.trustScore || 5} />
                            </div>
                            {[
                                { label: 'Rating (50%)', value: `${profile.averageRating || 0}/5`, pct: ((profile.averageRating || 0) / 5) * 100 },
                                { label: 'Completion (30%)', value: `${profile.completionRate || 100}%`, pct: profile.completionRate || 100 },
                                { label: 'Reliability (20%)', value: profile.totalCancellations === 0 ? '100%' : `${Math.max(0, 100 - (profile.totalCancellations || 0) * 10)}%`, pct: Math.max(0, 100 - (profile.totalCancellations || 0) * 10) },
                            ].map((item, i) => (
                                <div key={i} style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B7280' }}>{item.label}</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#003527' }}>{item.value}</span>
                                    </div>
                                    <div style={{ height: '8px', background: '#F3F4F6', borderRadius: '100px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${item.pct}%`, background: 'linear-gradient(90deg, #003527, #416900)', borderRadius: '100px', transition: 'width 1s ease' }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent reviews preview */}
                        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px', fontWeight: 'bold' }}>star_rate</span>
                                    <h3 style={{ margin: 0, fontFamily: 'Manrope,sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#003527' }}>Recent Reviews</h3>
                                </div>
                                {profile.ratingsReceived?.length > 0 && (
                                    <button onClick={() => setActiveTab('ratings')} style={{ background: 'none', border: 'none', color: '#416900', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                                        See all →
                                    </button>
                                )}
                            </div>
                            {profile.ratingsReceived?.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '1rem' }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>⭐</div>
                                    <p style={{ fontSize: '0.85rem' }}>No reviews yet</p>
                                </div>
                            ) : (
                                profile.ratingsReceived.slice(0, 3).map((r, i) => (
                                    <div key={i} style={{ padding: '10px 0', borderBottom: i < 2 ? '1px solid #F3F4F6' : 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#003527' }}>{r.reviewerName}</span>
                                            <StarRating score={r.score} size={14} />
                                        </div>
                                        {r.feedback && <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.4 }}>"{r.feedback}"</p>}
                                        <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#9CA3AF' }}>
                                            {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Ratings received tab */}
                {activeTab === 'ratings' && (
                    <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px', fontWeight: 'bold' }}>reviews</span>
                                <h3 style={{ margin: 0, fontFamily: 'Manrope,sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#003527' }}>Reviews Received</h3>
                            </div>
                            {profile.averageRating > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF3C7', padding: '6px 16px', borderRadius: '100px' }}>
                                    <StarRating score={Math.round(profile.averageRating)} size={16} />
                                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#92400E' }}>{profile.averageRating}/5</span>
                                </div>
                            )}
                        </div>
                        {profile.ratingsReceived?.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '3rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⭐</div>
                                <p style={{ fontWeight: 600 }}>No reviews yet</p>
                                <p style={{ fontSize: '0.85rem' }}>Reviews will appear here after NGOs rate your donations</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {profile.ratingsReceived.map((r, i) => (
                                    <div key={i} style={{ padding: '1rem', background: '#F9FAFB', borderRadius: '12px', borderLeft: '4px solid #F59E0B' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 700, color: '#003527' }}>{r.reviewerName}</p>
                                                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#9CA3AF' }}>
                                                    {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                <StarRating score={r.score} size={16} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: r.score >= 4 ? '#416900' : r.score >= 3 ? '#F59E0B' : '#DC2626' }}>
                                                    {r.score}/5
                                                </span>
                                            </div>
                                        </div>
                                        {r.feedback ? (
                                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: 1.5, fontStyle: 'italic' }}>
                                                "{r.feedback}"
                                            </p>
                                        ) : (
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#9CA3AF' }}>No written feedback</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Ratings given tab */}
                {activeTab === 'given' && (
                    <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px', fontWeight: 'bold' }}>rate_review</span>
                            <h3 style={{ margin: 0, fontFamily: 'Manrope,sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#003527' }}>Reviews Given</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {profile.ratingsGiven?.map((r, i) => (
                                <div key={i} style={{ padding: '1rem', background: '#F9FAFB', borderRadius: '12px', borderLeft: '4px solid #416900' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, color: '#003527' }}>To: {r.recipientName}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#9CA3AF' }}>
                                                {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <StarRating score={r.score} size={16} />
                                    </div>
                                    {r.feedback && (
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: 1.5, fontStyle: 'italic' }}>
                                            "{r.feedback}"
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Edit profile tab */}
                {activeTab === 'edit' && (
                    <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px', fontWeight: 'bold' }}>edit_note</span>
                            <h3 style={{ margin: 0, fontFamily: 'Manrope,sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#003527' }}>Edit Profile</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                    Full Name
                                </label>
                                <input
                                    value={editForm.fullName}
                                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                    Organization Name
                                </label>
                                <input
                                    value={editForm.organizationName}
                                    onChange={e => setEditForm({ ...editForm, organizationName: e.target.value })}
                                    placeholder="e.g., MealBridge Kitchen"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>
                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '100px', padding: '12px 24px', marginBottom: '1.5rem', fontSize: '0.8rem', color: '#065F46', fontWeight: 600 }}>
                            📍 To update your location, go to your <Link to={sessionStorage.getItem('role') === 'ROLE_DONOR' ? '/donor' : '/ngo'} style={{ color: '#003527', fontWeight: 800, textDecoration: 'underline' }}>Dashboard → My Location</Link>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#003527', color: 'white', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => { setActiveTab('overview'); setEditForm({ fullName: profile.fullName, organizationName: profile.organizationName || '' }); }}
                                style={{ padding: '10px 24px', borderRadius: '10px', border: '1.5px solid #E5E7EB', background: 'white', color: '#6B7280', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
