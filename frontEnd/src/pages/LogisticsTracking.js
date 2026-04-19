import React from 'react';
import { Link } from 'react-router-dom';

const LogisticsTracking = () => {
    // Mock data for tracking view
    const activeShipments = [
        { id: 'SHP-9021', from: 'Sunshine Bakery', to: 'NGO Hub Central', status: 'In Transit', driver: 'Marco R.', progress: 65 },
        { id: 'SHP-9025', from: 'Hotel Grand', to: 'Community Shelter', status: 'Pickup Scheduled', driver: 'Elena S.', progress: 10 },
    ];

    return (
        <div className="min-h-screen bg-surface flex">
            {/* Minimal Tracking Sidebar */}
            <aside className="w-80 bg-surface-container-low min-h-screen p-8 border-r border-outline-variant/15 overflow-y-auto">
                <div className="mb-10 flex items-center justify-between">
                    <Link to="/ngo" className="text-primary hover:opacity-70 transition-opacity">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h2 className="text-xl font-headline font-extrabold text-primary">Live Routes</h2>
                </div>

                <div className="space-y-6">
                    {activeShipments.map(shipment => (
                        <div key={shipment.id} className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-extrabold px-2 py-1 rounded bg-secondary-container text-primary uppercase tracking-widest">{shipment.id}</span>
                                <span className="text-[10px] font-bold text-on-surface-variant">{shipment.status}</span>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-secondary" />
                                    <p className="text-sm font-bold truncate">{shipment.from}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <p className="text-sm font-bold truncate">{shipment.to}</p>
                                </div>
                            </div>
                            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                                <div className="h-full impact-gradient transition-all duration-1000" style={{ width: `${shipment.progress}%` }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 p-6 rounded-2xl bg-primary-container text-white">
                    <p className="font-bold text-sm mb-2">Driver Sync</p>
                    <p className="text-xs opacity-70 mb-4">You have 12 drivers online in your area.</p>
                    <button className="w-full bg-white/20 text-white font-bold py-3 rounded-lg text-xs hover:bg-white/30">Connect Dispatch</button>
                </div>
            </aside>

            {/* Main Visual Tracking Area */}
            <main className="flex-1 relative bg-surface-container-high overflow-hidden">
                {/* Mock Map Background Overlay */}
                <div className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/grid.png")' }} />
                
                {/* Floating Navigation Controls */}
                <div className="absolute top-8 right-8 flex flex-col gap-4 z-10">
                    <div className="bg-white/80 backdrop-blur-xl p-2 rounded-2xl shadow-xl flex flex-col gap-2">
                        <button className="p-3 hover:bg-surface-container rounded-xl text-primary transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </button>
                        <button className="p-3 hover:bg-surface-container rounded-xl text-primary transition-colors border-t border-outline-variant/15">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 12H4" /></svg>
                        </button>
                    </div>
                </div>

                {/* Tracking Header */}
                <div className="absolute top-10 left-10 z-10 w-[400px]">
                    <div className="glass-card p-8 no-border bg-white/40 border border-white/50 shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl impact-gradient flex items-center justify-center text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-headline font-extrabold text-primary">Live Tracking</h3>
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Active Driver: Marco R.</p>
                            </div>
                        </div>
                        <div className="bg-white/60 rounded-2xl p-6 space-y-4">
                            <p className="text-xs font-extrabold text-secondary uppercase tracking-widest">Next Destination</p>
                            <p className="text-lg font-extrabold">NGO Hub Central</p>
                            <div className="flex items-center gap-3 text-sm font-bold text-on-surface-variant">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                <span>Approx. 4.2 miles • 12 mins</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Animated Vehicle (Mock) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                    <div className="relative">
                        <div className="absolute inset-0 bg-secondary blur-3xl opacity-20 animate-pulse" />
                        <div className="w-4 h-4 bg-secondary rounded-full shadow-lg border-4 border-white animate-bounce relative z-10" />
                        <div className="w-32 h-32 absolute -top-14 -left-14 border-2 border-dashed border-secondary rounded-full animate-spin-slow opacity-30" />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LogisticsTracking;
