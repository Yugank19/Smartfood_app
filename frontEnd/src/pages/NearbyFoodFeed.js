import React from 'react';
import { Link } from 'react-router-dom';

const NearbyFoodFeed = () => {
    // Mock food listings
    const listings = [
        { id: 1, name: '20kg Premium Rice', source: 'Hotel Grand Luxe', time: '15m ago', distance: '1.2 mi', urgency: 'Medium', tags: ['Pantry', 'Bulk'] },
        { id: 2, name: 'Fresh Garden Salad (50 units)', source: 'Green Mart', time: '2m ago', distance: '0.4 mi', urgency: 'High', tags: ['Prepared', 'Perishable'] },
        { id: 3, name: 'Assorted Bakery Crate', source: 'Sunshine Bakes', time: '45m ago', distance: '3.1 mi', urgency: 'Low', tags: ['Bakery'] },
        { id: 4, name: 'Dairy & Juice Packs', source: 'City Logistics Hub', time: '1h ago', distance: '2.5 mi', urgency: 'Medium', tags: ['Dairy', 'Cold Storage'] },
    ];

    return (
        <div className="min-h-screen bg-surface p-8 lg:p-12">
            <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 animate-slide-up">
                <div className="max-w-2xl">
                    <p className="text-secondary font-semibold text-sm uppercase tracking-widest mb-2">Real-time Network Feed</p>
                    <h1 className="text-4xl lg:text-5xl font-headline font-extrabold text-primary">Nearby Surplus Food</h1>
                    <p className="text-on-surface-variant mt-4 font-medium text-lg leading-relaxed">Connecting surplus food with distribution networks in real-time. Act fast to prevent waste and feed your community.</p>
                </div>
                <div className="flex gap-4">
                    <button className="bg-surface-container-low border border-outline-variant/15 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-surface-container transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
                        Filters
                    </button>
                    <button className="impact-gradient text-white px-8 py-4 rounded-2xl font-extrabold shadow-xl">
                        List Your Surplus
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
                {listings.map((item, idx) => (
                    <div key={item.id} className="card-elevated p-8 flex flex-col group hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-secondary-container/20 rounded-full blur-2xl group-hover:bg-secondary-container/40 transition-colors" />
                        
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${item.urgency === 'High' ? 'bg-red-500/10 text-red-600' : 'bg-primary-fixed text-primary-container'}`}>
                                {item.urgency} URGENCY
                            </span>
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{item.distance} away</span>
                        </div>

                        <h3 className="text-2xl font-headline font-extrabold mb-2 leading-tight group-hover:text-secondary transition-colors">{item.name}</h3>
                        <p className="text-on-surface-variant font-bold text-sm mb-6 flex items-center gap-2">
                             <svg className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
                             {item.source}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-8 mt-auto">
                            {item.tags.map(tag => (
                                <span key={tag} className="text-[9px] font-extrabold px-2 py-1 rounded-lg bg-surface-container-high text-on-surface-variant">#{tag}</span>
                            ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-outline-variant/10 pt-6 mt-auto relative z-10">
                            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Added {item.time}</div>
                            <button className="bg-primary hover:bg-primary-container text-white p-3 rounded-xl transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                            </button>
                        </div>
                    </div>
                ))}

                {/* Claim Assistance Card */}
                <div className="card-elevated bg-primary-container text-white lg:col-span-2 xl:col-span-1 p-8 flex flex-col justify-center relative overflow-hidden no-border group cursor-pointer">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-10 -mt-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <h3 className="text-3xl font-headline font-extrabold mb-4">Can't Find a Pickup?</h3>
                    <p className="opacity-80 font-medium mb-8">Alert our network of 500+ local volunteers to assist with urgent food transport.</p>
                    <button className="bg-white text-primary py-4 rounded-xl font-extrabold shadow-xl hover:translate-x-2 transition-transform">Broadcast Alert</button>
                </div>
            </div>
        </div>
    );
};

export default NearbyFoodFeed;
