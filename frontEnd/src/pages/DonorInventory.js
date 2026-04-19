import React from 'react';
import { Link } from 'react-router-dom';

const DonorInventory = () => {
    // Mock inventory data
    const inventory = [
        { id: 101, name: 'Premium Basmati Rice', quantity: '150 kg', expiry: 'Dec 2026', status: 'Available', color: 'primary' },
        { id: 102, name: 'Canned Mixed Vegetables', quantity: '500 units', expiry: 'Oct 2027', status: 'In Transit', color: 'secondary' },
        { id: 103, name: 'Assorted Energy Bars', quantity: '1,200 packs', expiry: 'Aug 2026', status: 'Reserved', color: 'tertiary' },
        { id: 104, name: 'Organic Olive Oil (5L)', quantity: '40 cans', expiry: 'Jan 2027', status: 'Available', color: 'primary' },
    ];

    return (
        <div className="min-h-screen bg-surface p-8 lg:p-12">
            <header className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 animate-slide-up">
                <div>
                    <p className="text-secondary font-semibold text-sm uppercase tracking-widest mb-2">Inventory Intelligence</p>
                    <h1 className="text-4xl lg:text-5xl font-headline font-extrabold text-primary">Warehouse Inventory</h1>
                </div>
                <div className="flex gap-4">
                    <button className="bg-primary-container text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-primary/20">
                        Add New Stock
                    </button>
                    <button className="bg-surface-container-low text-primary px-6 py-4 rounded-xl font-bold border border-outline-variant/15">
                        Download Manifest
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="card-elevated no-border p-0 overflow-hidden bg-white shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-surface-container-low border-b border-outline-variant/15 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                            <tr>
                                <th className="p-8">Asset Name</th>
                                <th className="p-8">ID</th>
                                <th className="p-8">Quantity</th>
                                <th className="p-8">Best Before</th>
                                <th className="p-8 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/5">
                            {inventory.map((item) => (
                                <tr key={item.id} className="group hover:bg-surface-container-low/50 transition-colors cursor-pointer">
                                    <td className="p-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:impact-gradient group-hover:text-white transition-all">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                            </div>
                                            <p className="font-extrabold text-lg text-on-surface">{item.name}</p>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-md">#{item.id}</span>
                                    </td>
                                    <td className="p-8">
                                        <p className="font-extrabold text-xl">{item.quantity}</p>
                                    </td>
                                    <td className="p-8">
                                        <p className="text-sm font-bold text-on-surface-variant">{item.expiry}</p>
                                    </td>
                                    <td className="p-8 text-right">
                                        <span className={`text-[10px] font-extrabold px-4 py-2 rounded-full uppercase tracking-widest ${
                                            item.status === 'Available' ? 'bg-secondary-container text-primary' : 
                                            item.status === 'In Transit' ? 'bg-primary-fixed text-primary-container' : 
                                            'bg-surface-container-highest text-on-surface-variant'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="p-8 bg-surface-container-low border-t border-outline-variant/15 flex justify-between items-center">
                        <p className="text-xs font-bold text-on-surface-variant tracking-widest uppercase">Showing 4 of 42 assets</p>
                        <div className="flex gap-2">
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-outline-variant/15 text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-30" disabled>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-outline-variant/15 text-primary hover:bg-primary hover:text-white transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Integration Info */}
                <div className="mt-12 p-8 rounded-3xl border border-dashed border-outline-variant flex flex-col md:flex-row items-center justify-between gap-8 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
                            <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92c-.41.43-.67.73-.67 1.33H11v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
                        </div>
                        <div>
                            <h4 className="font-extrabold text-xl">Integrate with your ERP?</h4>
                            <p className="text-sm font-medium">Connect your existing warehouse management system via API.</p>
                        </div>
                    </div>
                    <button className="text-primary font-bold hover:underline">View Documentation →</button>
                </div>
            </div>
        </div>
    );
};

export default DonorInventory;
