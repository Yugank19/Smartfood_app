import React from 'react';
import { Link } from 'react-router-dom';

const ImpactReports = () => {
    // Mock data for impact reports
    const metrics = [
        { label: 'Total Meals Provided', value: '42,500', trend: 'Global Network' },
        { label: 'Food Waste Prevented', value: '185 Tons', trend: 'Direct Impact' },
        { label: 'CO2 Emission Reduced', value: '12.4 Tons', trend: 'Sustainability' },
        { label: 'Network Partners', value: '85 NGOs', trend: 'Growth' },
    ];

    return (
        <div className="min-h-screen bg-surface p-8 lg:p-12">
            <header className="max-w-7xl mx-auto mb-16 animate-slide-up text-center">
                <p className="text-secondary font-semibold text-sm uppercase tracking-widest mb-2">The Curated Ecosystem / Legacy</p>
                <h1 className="text-5xl lg:text-7xl font-headline font-extrabold text-primary mb-6">Impact Report 2026</h1>
                <p className="max-w-3xl mx-auto text-on-surface-variant font-medium text-lg leading-relaxed">Quantifying the transformation of surplus into sustenance. Our network's collective effort in numbers.</p>
            </header>

            <div className="max-w-7xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
                {/* Hero Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {metrics.map((m, idx) => (
                        <div key={idx} className="card-elevated text-center py-12 bg-white no-border shadow-xl">
                            <p className="text-secondary font-extrabold text-[10px] uppercase tracking-widest mb-4">{m.trend}</p>
                            <h3 className="text-4xl font-extrabold text-primary mb-2">{m.value}</h3>
                            <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">{m.label}</p>
                        </div>
                    ))}
                </div>

                {/* Major Visualization Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    <div className="lg:col-span-2 card-elevated h-[500px] flex flex-col no-border bg-primary-container p-12 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/grid.png")' }} />
                        <h2 className="text-3xl font-headline font-extrabold mb-4 relative z-10">Global Redistribution Flow</h2>
                        <p className="opacity-70 font-medium mb-12 relative z-10">Visualizing the real-time movement of food from 450 active donors to 85 regional distribution hubs.</p>
                        <div className="mt-auto h-48 border-l-4 border-dashed border-white/20 ml-10 relative z-10">
                            {/* In a real app, use D3.js or similar for complex flow diagrams */}
                            <div className="absolute top-0 left-0 w-4 h-4 rounded-full bg-secondary shadow-lg shadow-secondary animate-ping" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 rounded-full bg-white animate-pulse" />
                        </div>
                    </div>

                    <div className="space-y-8 flex flex-col">
                        <div className="card-elevated flex-1 bg-secondary-container text-primary flex flex-col justify-center p-12 no-border items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-white mb-6 flex items-center justify-center shadow-lg">
                                <svg className="w-10 h-10 text-secondary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2V7h2v10z"/></svg>
                            </div>
                            <h3 className="text-2xl font-headline font-extrabold mb-2">Sustainable Growth</h3>
                            <p className="text-sm font-bold opacity-70">240% Increase in network velocity since last quarter.</p>
                        </div>
                        <div className="card-elevated flex-1 bg-surface-container-high border-none flex flex-col justify-center p-12 text-center">
                            <h3 className="text-3xl font-extrabold text-primary mb-2">12,400</h3>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-6 px-10">Active Volunteers across the globe</p>
                            <button className="impact-gradient text-white py-4 rounded-xl font-bold text-sm shadow-xl">Download Full PDF Report</button>
                        </div>
                    </div>
                </div>

                {/* Testimonial/Impact Section */}
                <div className="card-elevated no-border bg-white p-12 border-l-[12px] border-secondary mb-20">
                     <svg className="w-12 h-12 text-secondary/20 mb-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3H21.017V15C21.017 18.3137 18.3307 21 15.017 21H14.017ZM3.01697 21L3.01697 18C3.01697 16.8954 3.9124 16 5.01697 16H8.01697C8.56925 16 9.01697 15.5523 9.01697 15V9C9.01697 8.44772 8.56925 8 8.01697 8H5.01697C3.9124 8 3.01697 7.10457 3.01697 6V3H10.017V15C10.017 18.3137 7.3307 21 4.01697 21H3.01697Z"/></svg>
                     <blockquote className="text-3xl font-headline font-extrabold text-primary italic leading-tight mb-8">
                        "The Living Network hasn't just provided food; it has restored dignity to our community members while drastically reducing our business's environmental footprint."
                     </blockquote>
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full impact-gradient" />
                        <div>
                            <p className="font-extrabold text-primary">Elena Rodriguez</p>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Director, Hope Community Center</p>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ImpactReports;
