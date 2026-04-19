import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelection = () => {
    const navigate = useNavigate();

    const roles = [
        {
            id: 'donor',
            title: 'I am a Donor',
            desc: 'Business, Restaurant, or Individual looking to list surplus food.',
            icon: '🏢',
            theme: 'bg-primary-container',
            path: '/donor'
        },
        {
            id: 'ngo',
            title: 'I am an NGO',
            desc: 'Non-profit or Community Hub looking to distribute food to those in need.',
            icon: '🤝',
            theme: 'impact-gradient',
            path: '/ngo'
        },
        {
            id: 'volunteer',
            title: 'I am a Volunteer',
            desc: 'Driver or Local Hero willing to transport food between entities.',
            icon: '🚚',
            theme: 'bg-secondary',
            path: '/volunteer'
        }
    ];

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-8 lg:p-12 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-secondary-container/10 rounded-full blur-3xl -mr-96 -mt-96 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-fixed/20 rounded-full blur-3xl -ml-64 -mb-64" />

            <div className="max-w-7xl w-full relative z-10">
                <header className="text-center mb-20 animate-slide-up">
                    <p className="text-secondary font-semibold text-sm uppercase tracking-widest mb-4">Choose Your Identity</p>
                    <h1 className="text-5xl lg:text-7xl font-headline font-extrabold text-primary leading-tight">Join The Living Network</h1>
                    <p className="max-w-2xl mx-auto text-on-surface-variant font-medium text-lg mt-6">Select your role to access your personalized ecosystem dashboard and start making an impact.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    {roles.map((role) => (
                        <div 
                            key={role.id}
                            onClick={() => navigate(role.path)}
                            className="group card-elevated p-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-500 flex flex-col no-border bg-white shadow-2xl"
                        >
                            <div className={`h-40 ${role.theme} flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-700`}>
                                {role.icon}
                            </div>
                            <div className="p-10 flex flex-col items-center text-center">
                                <h2 className="text-2xl font-headline font-extrabold text-primary mb-4">{role.title}</h2>
                                <p className="text-on-surface-variant font-medium text-sm leading-relaxed mb-10 h-12">
                                    {role.desc}
                                </p>
                                <button className="w-full py-4 rounded-xl font-extrabold text-sm border-2 border-outline-variant/20 text-primary group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300 tracking-widest uppercase">
                                    Select Identity
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
                    <p className="text-on-surface-variant font-bold text-sm">
                        Already have an account? <span className="text-secondary hover:underline cursor-pointer">Login here</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;
