import React from 'react';

const SettingsPage = () => {
    return (
        <div className="min-h-screen bg-surface p-8 lg:p-12">
            <header className="max-w-4xl mx-auto mb-12 animate-slide-up">
                <p className="text-secondary font-semibold text-sm uppercase tracking-widest mb-2">The Curated Ecosystem / Account</p>
                <h1 className="text-4xl font-headline font-extrabold text-primary">Platform Settings</h1>
            </header>

            <div className="max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="space-y-8">
                    {/* Profile Section */}
                    <section className="card-elevated">
                        <h2 className="text-2xl font-headline font-extrabold mb-8 border-b border-outline-variant/15 pb-4">Profile Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Display Name</label>
                                <input type="text" placeholder="Hotel Grand Luxe" className="w-full bg-surface-container-low border-2 border-outline-variant/10 rounded-xl p-4 font-bold text-primary focus:border-primary outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Authorized Email</label>
                                <input type="email" placeholder="admin@grandluxe.com" className="w-full bg-surface-container-low border-2 border-outline-variant/10 rounded-xl p-4 font-bold text-primary focus:border-primary outline-none transition-all" />
                            </div>
                        </div>
                    </section>

                    {/* Notification Section */}
                    <section className="card-elevated">
                        <h2 className="text-2xl font-headline font-extrabold mb-8 border-b border-outline-variant/15 pb-4">Communication Prefs</h2>
                        <div className="space-y-6">
                            {[
                                { title: 'Nearby Food Alerts', desc: 'Get notified when surplus food is listed within 5 miles.' },
                                { title: 'Pickup Confirmations', desc: 'Real-time updates when a volunteer claims your listing.' },
                                { title: 'Impact Milestones', desc: 'Monthly reports on your CO2 and meal contributions.' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl hover:bg-surface-container-low transition-colors">
                                    <div className="max-w-md">
                                        <p className="font-extrabold text-primary mb-1">{item.title}</p>
                                        <p className="text-xs font-medium text-on-surface-variant leading-relaxed">{item.desc}</p>
                                    </div>
                                    <div className="w-12 h-6 bg-secondary rounded-full relative p-1 cursor-pointer">
                                        <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Security Section */}
                    <section className="card-elevated no-border bg-primary-container text-white p-10">
                        <h2 className="text-2xl font-headline font-extrabold mb-4">Security Hub</h2>
                        <p className="opacity-70 font-medium mb-8">Manage your authentication methods and authorized devices for "The Living Network".</p>
                        <div className="flex gap-4">
                            <button className="bg-white text-primary px-8 py-3 rounded-xl font-extrabold shadow-lg hover:scale-105 transition-transform">
                                Change Password
                            </button>
                            <button className="bg-white/10 text-white px-8 py-3 rounded-xl font-bold border border-white/20 hover:bg-white/20 transition-colors">
                                2FA Setup
                            </button>
                        </div>
                    </section>

                    {/* Damage Control */}
                    <div className="flex justify-center pt-10">
                        <button className="text-red-500 font-extrabold text-sm uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
                            Deactivate Platform Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
