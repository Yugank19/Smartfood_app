import { API_BASE_URL } from '../config';
import axios from 'axios';

/**
 * Feature 5: Advanced Analytics Dashboard
 * Shows charts, top donors/NGOs, daily trends, success rates.
 */
const AdvancedAnalytics = ({ token }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/admin/analytics/advanced`, authHeader)
            .then(res => { setData(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center py-12 text-on-surface-variant">Loading analytics...</div>;
    if (!data) return <div className="text-center py-12 text-on-surface-variant">No data available.</div>;

    const StatCard = ({ label, value, icon, color = '#003527' }) => (
        <div className="card-elevated text-center">
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{icon}</div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color, margin: '0 0 4px' }}>{value}</h3>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
        </div>
    );

    // Simple bar chart using CSS
    const BarChart = ({ data: chartData, label }) => {
        const max = Math.max(...chartData.map(d => d.listings || d.deliveries || 0), 1);
        return (
            <div>
                <h4 style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, color: '#003527', marginBottom: '12px' }}>{label}</h4>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px' }}>
                    {chartData.map((d, i) => {
                        const val = d.listings || d.deliveries || 0;
                        const height = max > 0 ? (val / max) * 100 : 0;
                        return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#003527' }}>{val}</span>
                                <div style={{ width: '100%', height: `${height}%`, minHeight: val > 0 ? '4px' : '0', background: 'linear-gradient(135deg,#003527,#064e3b)', borderRadius: '4px 4px 0 0', transition: 'height 0.5s' }} />
                                <span style={{ fontSize: '0.6rem', color: '#9CA3AF', transform: 'rotate(-45deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>
                                    {d.date?.slice(5) || d.name?.split(' ')[0]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-slide-up">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard label="Success Rate" value={`${data.pickupSuccessRate}%`} icon="✅" color="#416900" />
                <StatCard label="Expiry Rate" value={`${data.expiryRate}%`} icon="⏰" color="#F59E0B" />
                <StatCard label="Avg Response" value={`${data.avgResponseTimeMinutes}m`} icon="⚡" color="#1A73E8" />
                <StatCard label="Total Listings" value={data.totalListings} icon="📋" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard label="Active Donors" value={data.totalDonors} icon="🍽" />
                <StatCard label="Active NGOs" value={data.totalNGOs} icon="🤝" />
                <StatCard label="Volunteers" value={data.totalVolunteers} icon="🚴" />
                <StatCard label="Animal Care" value={data.totalAnimalCare} icon="🐾" />
            </div>

            {/* Daily Trend Chart */}
            <div className="card-elevated">
                <BarChart data={data.dailyTrend || []} label="📈 Listings Posted — Last 7 Days" />
            </div>

            {/* Top Donors & NGOs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card-elevated">
                    <h4 style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, color: '#003527', marginBottom: '16px' }}>🏆 Top Donors</h4>
                    {(data.topDonors || []).map((d, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < data.topDonors.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#003527', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{i + 1}</span>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.name}</span>
                            </div>
                            <span style={{ fontWeight: 800, color: '#416900', fontSize: '0.875rem' }}>{d.deliveries} deliveries</span>
                        </div>
                    ))}
                    {(!data.topDonors || data.topDonors.length === 0) && <p style={{ color: '#9CA3AF', textAlign: 'center' }}>No data yet</p>}
                </div>

                <div className="card-elevated">
                    <h4 style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, color: '#003527', marginBottom: '16px' }}>🤝 Top NGOs</h4>
                    {(data.topNGOs || []).map((n, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < data.topNGOs.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#416900', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{i + 1}</span>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{n.name}</span>
                            </div>
                            <span style={{ fontWeight: 800, color: '#003527', fontSize: '0.875rem' }}>{n.claims} claims</span>
                        </div>
                    ))}
                    {(!data.topNGOs || data.topNGOs.length === 0) && <p style={{ color: '#9CA3AF', textAlign: 'center' }}>No data yet</p>}
                </div>
            </div>

            {/* Food Category Breakdown */}
            {data.listingsByCategory && (
                <div className="card-elevated">
                    <h4 style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, color: '#003527', marginBottom: '16px' }}>🍽 Listings by Category</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {Object.entries(data.listingsByCategory).map(([cat, count]) => (
                            <div key={cat} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: '#003527' }}>{count}</span>
                                <span style={{ fontSize: '0.8rem', color: '#416900', fontWeight: 600 }}>{cat}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedAnalytics;
