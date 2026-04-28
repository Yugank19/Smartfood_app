import { API_BASE_URL } from '../config';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RouteMap from '../components/RouteMap';
import RouteOptimizer from '../components/RouteOptimizer';
import ChatBox from '../components/ChatBox';

const VolunteerDashboard = () => {
    const [availablePickups, setAvailablePickups] = useState([]);
    const [myAssignments, setMyAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [selectedImageSet, setSelectedImageSet] = useState(null); // For viewing photos
    const [selectedDetailListing, setSelectedDetailListing] = useState(null); // Full details
    const [routeTarget, setRouteTarget] = useState(null);
    const [showRouteOptimizer, setShowRouteOptimizer] = useState(false); // Feature 8
    const [chatPickupId, setChatPickupId] = useState(null); // Feature 4
    const navigate = useNavigate();

    const token = sessionStorage.getItem('token');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    const fetchData = useCallback(async () => {
        try {
            const [availRes, assignRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/pickups/available`, authHeader),
                axios.get(`${API_BASE_URL}/api/pickups/my-assignments`, authHeader)
            ]);
            setAvailablePickups(availRes.data);
            setMyAssignments(assignRes.data);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                sessionStorage.clear(); navigate('/login');
            }
        } finally { setLoading(false); }
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const showMsg = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 5000); };

    const handleAccept = async (id) => {
        try {
            await axios.post(`${API_BASE_URL}/api/pickups/${id}/accept`, {}, authHeader);
            showMsg('✓ Task accepted! Check your assignments.');
            fetchData();
        } catch (err) {
            showMsg('Error: ' + (err.response?.data?.message || 'Could not accept task.'));
        }
    };

    const handleStatus = async (id, status) => {
        try {
            await axios.patch(`${API_BASE_URL}/api/pickups/${id}/status`, { status }, authHeader);
            showMsg(`✓ Status updated to ${status.replace('_', ' ')}.`);
            fetchData();
        } catch (err) {
            showMsg('Error: ' + (err.response?.data?.message || 'Could not update status.'));
        }
    };

    const deliveredCount = myAssignments.filter(a => a.status === 'DELIVERED').length;
    const activeTask = myAssignments.find(a => a.status === 'ASSIGNED' || a.status === 'PICKED_UP');

    const stats = [
        { label: 'Active Tasks', value: myAssignments.filter(a => a.status !== 'DELIVERED').length.toString() },
        { label: 'Deliveries Done', value: deliveredCount.toString() },
        { label: 'Available Pickups', value: availablePickups.length.toString() },
    ];

    return (
        <div className="flex min-h-screen bg-surface">
            {/* Route Modal */}
            {routeTarget && (
                <RouteMap
                    donorLat={routeTarget.lat}
                    donorLng={routeTarget.lng}
                    donorName={routeTarget.donorName}
                    foodType={routeTarget.foodType}
                    onClose={() => setRouteTarget(null)}
                />
            )}
            {/* Feature 8: Route Optimizer */}
            {showRouteOptimizer && (
                <RouteOptimizer token={token} onClose={() => setShowRouteOptimizer(false)} />
            )}
            {/* Feature 4: Chat */}
            {chatPickupId && (
                <ChatBox
                    pickupId={chatPickupId}
                    currentUserPhone={sessionStorage.getItem('phone')}
                    currentUserRole="VOLUNTEER"
                    onClose={() => setChatPickupId(null)}
                />
            )}
            {/* Sidebar */}
            <aside className="w-72 sidebar min-h-screen p-8 hidden lg:block">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 rounded-xl impact-gradient flex items-center justify-center text-white shadow-lg">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                    <span className="font-headline font-bold text-xl text-primary">Living Network</span>
                </div>
                <nav className="space-y-2">
                    <div className="nav-item-active p-3 px-6 cursor-pointer">Live Tasks</div>
                    <div onClick={() => setShowRouteOptimizer(true)} className="p-3 px-6 text-on-surface-variant hover:text-primary cursor-pointer transition-colors font-medium">
                        🗺 Optimize Route
                    </div>
                    <Link to="/" className="block p-3 px-6 text-on-surface-variant hover:text-primary cursor-pointer transition-colors font-medium" style={{ textDecoration: 'none' }}>Home</Link>
                </nav>
                <div className="mt-auto pt-10">
                    <div className="glass-card p-6 text-center">
                        <div className="w-12 h-12 rounded-full impact-gradient mx-auto mb-4 flex items-center justify-center text-white shadow-lg">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                        <p className="font-extrabold text-primary mb-1">{deliveredCount} Deliveries</p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Completed</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 lg:p-12">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-slide-up">
                    <div>
                        <p className="text-secondary font-semibold text-sm uppercase tracking-widest mb-2">The Curated Ecosystem</p>
                        <h1 className="text-4xl font-headline font-extrabold text-primary">Volunteer Dashboard</h1>
                    </div>
                </header>

                {message && (
                    <div className={`mb-8 px-5 py-4 rounded-xl font-semibold text-sm ${message.startsWith('Error') ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-primary-container'}`}>
                        {message}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-slide-up">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="card-elevated border-none bg-surface-container-low text-center">
                            <p className="text-secondary font-extrabold text-xs uppercase tracking-widest mb-2">{stat.label}</p>
                            <h3 className="text-5xl font-extrabold text-primary">{loading ? '...' : stat.value}</h3>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Active Task */}
                        <section className="card-elevated">
                            <h2 className="text-2xl font-headline font-extrabold mb-8 border-b border-outline-variant/15 pb-4">Next Pickup Details</h2>
                            {loading ? (
                                <div className="text-center py-12 text-on-surface-variant">Loading...</div>
                            ) : activeTask ? (
                                <div className="flex flex-col md:flex-row gap-8 items-center bg-surface p-8 rounded-3xl border border-outline-variant/10">
                                    <div className="w-full md:w-48 h-48 rounded-2xl bg-surface-container-low overflow-hidden relative shadow-md">
                                        {activeTask.imageUrls && activeTask.imageUrls.length > 0 ? (
                                            <>
                                                <img 
                                                    src={activeTask.imageUrls[0]} 
                                                    alt="Food" 
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" 
                                                    onClick={() => setSelectedImageSet(activeTask.imageUrls)}
                                                />
                                                {activeTask.imageUrls.length > 1 && (
                                                    <div className="absolute bottom-0 right-0 bg-primary/80 text-white text-xs font-bold px-2 py-1 rounded-tl-xl">
                                                        +{activeTask.imageUrls.length - 1}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🍽</div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-6 w-full">
                                        <div className="flex items-start gap-4">
                                            <div className="w-2 h-2 rounded-full bg-secondary mt-2" />
                                            <div>
                                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Pickup From</p>
                                                <p className="text-xl font-extrabold">{activeTask.location}</p>
                                                <p className="text-sm text-on-surface-variant">{activeTask.foodType} · {activeTask.quantity}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                                            <div>
                                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Deliver To</p>
                                                <p className="text-xl font-extrabold">{activeTask.ngoName}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto flex flex-col gap-3">
                                        <div className="bg-secondary/10 p-4 rounded-2xl text-center">
                                            <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Status</p>
                                            <p className="font-extrabold">{activeTask.status.replace('_', ' ')}</p>
                                        </div>
                                        {activeTask.status === 'ASSIGNED' && (
                                            <button onClick={() => handleStatus(activeTask.id, 'PICKED_UP')} className="impact-gradient text-white px-8 py-4 rounded-2xl font-extrabold shadow-lg hover:scale-105 transition-transform">
                                                Confirm Pickup
                                            </button>
                                        )}
                                        {activeTask.status === 'PICKED_UP' && (
                                            <button onClick={() => handleStatus(activeTask.id, 'DELIVERED')} className="bg-secondary-container text-on-secondary-fixed-variant px-8 py-4 rounded-2xl font-extrabold shadow-lg hover:scale-105 transition-transform">
                                                Confirm Delivery
                                            </button>
                                        )}
                                        {activeTask.foodListingLat && (
                                            <button
                                                onClick={() => setRouteTarget({
                                                    lat: activeTask.foodListingLat,
                                                    lng: activeTask.foodListingLng,
                                                    donorName: 'Donor',
                                                    foodType: activeTask.foodType
                                                })}
                                                className="w-full mt-2 py-3 rounded-2xl font-extrabold text-sm border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                                            >
                                                🧭 Get Route & ETA to Pickup
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-surface rounded-3xl opacity-50">
                                    <p className="font-bold text-on-surface-variant">No active tasks. Accept a pickup from the Task Market!</p>
                                </div>
                            )}
                        </section>

                        {/* All Assignments */}
                        {myAssignments.length > 0 && (
                            <section className="card-elevated">
                                <h2 className="text-xl font-headline font-extrabold mb-6">All My Assignments</h2>
                                <div className="space-y-4">
                                    {myAssignments.map(a => (
                                        <div key={a.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors">
                                            <div>
                                                <p className="font-bold">{a.foodType}</p>
                                                <p className="text-sm text-on-surface-variant">{a.quantity} → {a.ngoName}</p>
                                            </div>
                                            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${a.status === 'DELIVERED' ? 'bg-primary-fixed text-primary-container' : 'bg-secondary-container text-on-secondary-fixed-variant'}`}>
                                                {a.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Task Market */}
                    <div className="space-y-8">
                        <section className="card-elevated bg-primary-container text-white no-border">
                            <h3 className="text-xl font-extrabold mb-6">Task Market</h3>
                            {loading ? (
                                <p className="text-sm opacity-70">Loading...</p>
                            ) : availablePickups.length === 0 ? (
                                <p className="text-sm opacity-70">No tasks available right now.</p>
                            ) : (
                                <div className="space-y-4">
                                    {availablePickups.map(pickup => (
                                        <div key={pickup.id} className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors">
                                            <div className="flex gap-3 mb-3">
                                                <div className="w-16 h-16 rounded-xl bg-white/10 overflow-hidden shrink-0 relative">
                                                    {pickup.imageUrls && pickup.imageUrls.length > 0 ? (
                                                         <>
                                                             <img 
                                                                 src={pickup.imageUrls[0]} 
                                                                 alt="Food" 
                                                                 className="w-full h-full object-cover cursor-pointer" 
                                                                 onClick={() => setSelectedImageSet(pickup.imageUrls)}
                                                             />
                                                             {pickup.imageUrls.length > 1 && (
                                                                 <div className="absolute bottom-0 right-0 bg-primary/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-lg">
                                                                     +{pickup.imageUrls.length - 1}
                                                                 </div>
                                                             )}
                                                         </>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xl opacity-20">🍽</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-[10px] font-bold text-secondary-container tracking-widest uppercase">AVAILABLE</span>
                                                        <span className="text-[10px] font-bold opacity-40">#{pickup.id}</span>
                                                    </div>
                                                    <p className="font-bold text-sm truncate">{pickup.foodType}</p>
                                                    <p className="text-[10px] opacity-70 truncate">{pickup.quantity}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs opacity-70 mb-1">📍 {pickup.location}</p>
                                            <p className="text-xs opacity-70 mb-3">For: {pickup.ngoName}</p>
                                            <button
                                                onClick={() => setSelectedDetailListing(pickup)}
                                                className="w-full bg-white/10 text-white font-extrabold text-[10px] py-2 rounded-xl mb-1 hover:bg-white/20 transition-colors"
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => handleAccept(pickup.id)}
                                                className="w-full bg-secondary-container text-primary font-extrabold text-xs py-2 rounded-xl hover:scale-105 transition-transform"
                                            >
                                                Accept Task
                                            </button>
                                            {pickup.latitude && (
                                                <button
                                                    onClick={() => setRouteTarget({
                                                        lat: pickup.latitude,
                                                        lng: pickup.longitude,
                                                        donorName: pickup.ngoName || 'Donor',
                                                        foodType: pickup.foodType
                                                    })}
                                                    className="w-full mt-1 bg-white/10 text-white font-extrabold text-xs py-2 rounded-xl hover:bg-white/20 transition-colors"
                                                >
                                                    🧭 Route & ETA
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>
            {/* Image Set Modal */}
            {selectedImageSet && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setSelectedImageSet(null)}>
                    <div className="max-w-4xl w-full relative" onClick={e => e.stopPropagation()}>
                        <button 
                            className="absolute -top-12 right-0 text-white text-3xl font-bold p-2"
                            onClick={() => setSelectedImageSet(null)}
                        >
                            ×
                        </button>
                        <div className="flex flex-wrap justify-center gap-4 max-h-[80vh] overflow-y-auto p-4">
                            {selectedImageSet.map((url, i) => (
                                <div key={i} className="rounded-2xl overflow-hidden shadow-2xl bg-white p-2">
                                    <img src={url} alt={`Food ${i}`} className="max-w-full h-auto rounded-xl object-contain" style={{ maxHeight: '70vh' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* Listing Detail Modal */}
            {selectedDetailListing && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedDetailListing(null)}>
                    <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="relative h-64 bg-slate-100">
                            {selectedDetailListing.imageUrls && selectedDetailListing.imageUrls.length > 0 ? (
                                <div className="flex h-full overflow-x-auto snap-x scrollbar-hide">
                                    {selectedDetailListing.imageUrls.map((url, i) => (
                                        <img key={i} src={url} alt={`Food ${i}`} className="h-full w-full object-cover shrink-0 snap-center" />
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-6xl opacity-10">🍽</div>
                            )}
                            <button 
                                onClick={() => setSelectedDetailListing(null)}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center font-bold text-xl backdrop-blur-md"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-primary mb-1">{selectedDetailListing.foodType}</h2>
                                    <p className="text-secondary font-bold">👤 NGO: {selectedDetailListing.ngoName}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">📦 {selectedDetailListing.quantity}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Donor Name</p>
                                    <p className="text-sm font-bold">{selectedDetailListing.donorName}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Expiry</p>
                                    <p className="text-sm font-bold text-red-600">{new Date(selectedDetailListing.pickupEndTime).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <span className="text-xl">📍</span>
                                    <div>
                                        <p className="text-xs font-bold opacity-50 uppercase tracking-tighter">Pickup Location</p>
                                        <p className="text-sm font-medium">{selectedDetailListing.location}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => {
                                        setSelectedDetailListing(null);
                                        handleAccept(selectedDetailListing.id);
                                    }}
                                    className="flex-1 py-4 rounded-2xl impact-gradient text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                                >
                                    Accept This Task →
                                </button>
                                {selectedDetailListing.latitude && (
                                    <button 
                                        onClick={() => {
                                            const l = selectedDetailListing;
                                            setSelectedDetailListing(null);
                                            setRouteTarget({
                                                lat: l.latitude,
                                                lng: l.longitude,
                                                donorName: l.donorName,
                                                foodType: l.foodType
                                            });
                                        }}
                                        className="px-6 rounded-2xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-colors"
                                    >
                                        🗺 Route
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VolunteerDashboard;
