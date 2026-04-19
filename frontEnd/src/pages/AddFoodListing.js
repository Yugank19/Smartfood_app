import React, { useState } from 'react';

const AddFoodListing = () => {
    const [formData, setFormData] = useState({
        foodName: '',
        quantity: '',
        expiryDate: '',
        category: 'Prepared Meals',
        location: '',
        description: ''
    });

    const categories = ['Prepared Meals', 'Fruits & Vegetables', 'Bakery Items', 'Dairy & Eggs', 'Pantry Staples'];

    return (
        <div className="min-h-screen bg-surface p-8 lg:p-12">
            <header className="max-w-4xl mx-auto mb-12 animate-slide-up">
                <p className="text-secondary font-semibold text-sm uppercase tracking-widest mb-2">The Curated Ecosystem</p>
                <h1 className="text-4xl font-headline font-extrabold text-primary">Post Surplus Food</h1>
                <p className="text-on-surface-variant mt-2 font-medium">Your contribution will be immediately visible to nearby NGOs and volunteers.</p>
            </header>

            <div className="max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="card-elevated p-10 lg:p-16 relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed/30 blur-3xl -mr-32 -mt-32 rounded-full" />
                    
                    <form className="relative z-10 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-primary uppercase tracking-widest">Food Item Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Fresh Garden Salad" 
                                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary p-4 text-lg font-bold outline-none transition-all placeholder:opacity-30"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-primary uppercase tracking-widest">Category</label>
                                <select className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary p-4 text-lg font-bold outline-none transition-all">
                                    {categories.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-primary uppercase tracking-widest">Quantity / Amount</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 50 units or 20 kg" 
                                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary p-4 text-lg font-bold outline-none transition-all placeholder:opacity-30"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-primary uppercase tracking-widest">Expiry Time / Best Before</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary p-4 text-lg font-bold outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-primary uppercase tracking-widest">Pickup Location</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Confirm your business address" 
                                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary p-4 pr-12 text-lg font-bold outline-none transition-all placeholder:opacity-30"
                                />
                                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-primary uppercase tracking-widest">Handling Instructions</label>
                            <textarea 
                                rows="3"
                                placeholder="e.g. Please bring cooling bags, pickup from the back entrance."
                                className="w-full bg-surface-container-low border-2 border-outline-variant focus:border-primary p-6 rounded-2xl text-lg font-medium outline-none transition-all placeholder:opacity-30"
                            ></textarea>
                        </div>

                        <div className="pt-8 flex flex-col md:flex-row gap-6">
                            <button className="flex-1 impact-gradient text-white py-5 rounded-2xl font-extrabold text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-transform">
                                Publish Listing
                            </button>
                            <button className="px-10 py-5 rounded-2xl font-bold text-primary bg-surface-container-high hover:bg-surface-container-highest transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
                
                {/* Secondary Info */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                    <div className="p-8 rounded-3xl bg-primary-container text-white">
                        <h4 className="text-xl font-headline font-bold mb-4">Quality Standards</h4>
                        <p className="opacity-80 text-sm leading-relaxed">By posting, you confirm the food is safe for consumption and follows your local health & safety regulations. Quality is the core of The Living Network.</p>
                    </div>
                    <div className="p-8 rounded-3xl bg-secondary-container text-primary">
                        <h4 className="text-xl font-headline font-bold mb-4">What Happens Next?</h4>
                        <p className="opacity-80 text-sm leading-relaxed">NGOs in your 10-mile radius will be notified. Once an NGO claims it, a volunteer will be assigned to coordinate the pickup.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddFoodListing;
