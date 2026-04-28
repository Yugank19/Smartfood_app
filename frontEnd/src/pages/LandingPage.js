import { API_BASE_URL } from '../config';
import { Link } from 'react-router-dom';
import axios from 'axios';

const LandingPage = () => {
    const [publicStats, setPublicStats] = useState({ totalMealsSaved: null, activeDonors: null });

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/analytics/public`)
            .then(res => setPublicStats(res.data))
            .catch(() => {});
    }, []);

    const fmt = (val, fallback) => val !== null && val !== undefined ? val.toLocaleString() : fallback;

    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    const dashboardPath = {
        ROLE_DONOR: '/donor', ROLE_NGO: '/ngo', ROLE_VOLUNTEER: '/volunteer', ROLE_ADMIN: '/admin'
    }[role] || '/';

    return (
        <div className="bg-surface font-body text-on-surface">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-32 px-10">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div className="flex flex-col gap-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold uppercase tracking-widest w-fit">
                            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                            Real-time Logistics
                        </div>
                        <h1 className="text-primary font-headline text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
                            Smart Food Redistribution Platform
                        </h1>
                        <p className="text-on-surface-variant text-lg lg:text-xl leading-relaxed max-w-xl">
                            Our smart ecosystem bridges the gap between surplus food and those who need it most. We turn logistics into lifelines through real-time redistribution.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            {token ? (
                                <Link to={dashboardPath} className="impact-gradient text-on-primary px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center gap-2 group">
                                    Go to Dashboard
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </Link>
                            ) : (
                                <>
                                    <Link to="/register" className="impact-gradient text-on-primary px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center gap-2 group">
                                        Become a Donor
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </Link>
                                    <Link to="/register" className="bg-surface-container-high text-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface-container-highest transition-all">
                                        Register as NGO
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -top-12 -left-12 w-64 h-64 bg-secondary-fixed/30 rounded-full blur-[100px] -z-10"></div>
                        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-primary-fixed/30 rounded-full blur-[100px] -z-10"></div>
                        <div className="rounded-[2.5rem] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                            <img
                                alt="Community food sharing"
                                className="w-full aspect-[4/5] object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBb5BEcyMyIs3CLj73ZjBRRUGIavgZ14sCN8cPsVHwPaRZFkIzMdq2ymyJhk5rfrK0lFNokmTuAlidHt8d92YmEewNIZ_cYo-qfG4rToMynQ9HISxGdCFGdD0jDNQWKrzav-16Ik4zKPUF507beH_EdHrVsOCpyRlccvKp55WQ4hagqldwalBDcA3IdsoC5wDLWhlU3qA5LwPpyCdccM16FUEaMKc8SP3dmxuZ4VOUTJ0CZG2-sAJt2Ih1QJkmQ6BcLhWshIGXVgpA"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Impact Counters */}
            <section className="bg-surface-container-low py-20">
                <div className="max-w-7xl mx-auto px-10">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-surface-container-lowest p-10 rounded-[2rem] shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-secondary/10 group-hover:text-secondary/20 transition-colors">
                                <span className="material-symbols-outlined text-8xl">restaurant</span>
                            </div>
                            <p className="text-on-surface-variant font-semibold uppercase tracking-widest text-sm mb-4">Meals Redistributed</p>
                            <h2 className="text-primary font-headline text-5xl font-extrabold">{fmt(publicStats.totalMealsSaved, '1.42M+')}</h2>
                            <div className="mt-4 flex items-center gap-2 text-secondary font-bold">
                                <span className="material-symbols-outlined">trending_up</span>
                                <span>+18% this month</span>
                            </div>
                        </div>
                        <div className="bg-surface-container-lowest p-10 rounded-[2rem] shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-secondary/10 group-hover:text-secondary/20 transition-colors">
                                <span className="material-symbols-outlined text-8xl">groups</span>
                            </div>
                            <p className="text-on-surface-variant font-semibold uppercase tracking-widest text-sm mb-4">People Impacted</p>
                            <h2 className="text-primary font-headline text-5xl font-extrabold">850K+</h2>
                            <div className="mt-4 flex items-center gap-2 text-secondary font-bold">
                                <span className="material-symbols-outlined">add_circle</span>
                                <span>42 New Partners</span>
                            </div>
                        </div>
                        <div className="bg-surface-container-lowest p-10 rounded-[2rem] shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-secondary/10 group-hover:text-secondary/20 transition-colors">
                                <span className="material-symbols-outlined text-8xl">eco</span>
                            </div>
                            <p className="text-on-surface-variant font-semibold uppercase tracking-widest text-sm mb-4">CO2 Emissions Saved</p>
                            <h2 className="text-primary font-headline text-5xl font-extrabold">320T</h2>
                            <div className="mt-4 flex items-center gap-2 text-secondary font-bold">
                                <span className="material-symbols-outlined">verified</span>
                                <span>Certified Offset</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-32 px-10">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-20 text-center max-w-3xl mx-auto">
                        <h2 className="text-primary font-headline text-4xl lg:text-5xl font-extrabold mb-6">A Living Ecosystem</h2>
                        <p className="text-on-surface-variant text-lg">
                            Our platform uses AI-driven logistics to ensure zero waste by connecting donors, drivers, and NGOs in a seamless loop.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: 'inventory_2',
                                title: '1. Inventory Log',
                                desc: 'Donors scan surplus stock. Our AI categorizes and estimates shelf-life for optimal routing.',
                                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-Tw83lRiGVO91345tUsX0tmotpuh0zbAwS_NGeuowhlyMrnRSxBQ6_7pOEOJgVsdVaAVYHAkm9SNpdI-PVTsLBb4_iel06QLzeIcrMEBOxYu-iDQ0cGhBS6MR5y5lpUlR0oKAz3DA4cj1ASRy1wYR9wkGzE6nKNwDnaIqy2ZOmt3eohDlr9_1Bs0D2I_NU_amJuSaB1LTCmRrtsH_fHdVlxajCwnjX22G1odY91nVBy7ZZQb8iFulf-s_D2OJvWTCc7Jryma5ZT0',
                                bg: 'bg-primary-fixed'
                            },
                            {
                                icon: 'route',
                                title: '2. Dynamic Routing',
                                desc: 'We match local demand from vetted NGOs with the nearest supply, minimizing transit time and cost.',
                                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGMIuumn7EUw4Yvspkf-dCeid3_n6cIfBdsekxxwdYE6-OoZ9kNhNTpbhgRv7lZIl9FVBfuqwt4TZIXE1OJf--DPVnP0_RJYNh0t2pheOJYsOvgiuBsRLiNA3uYMGyimljmIsFE8P7FaVdQP_Pwx6artJK3SY-QEV3xLoxBkYCXLCaHRrsfoIrfvlKWv0ImqmjRvSmfofoVKFygAwYW44iT9XM9ORJzIZ5fgzIHLYbavvT2yanledfH2qrBojFPNd9IKCByx3Y9s8',
                                bg: 'bg-secondary-fixed'
                            },
                            {
                                icon: 'volunteer_activism',
                                title: '3. Last Mile Impact',
                                desc: 'Vetted NGOs receive notification and pick up or receive delivery, feeding communities instantly.',
                                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9CG2f_hKALfRCXUd7xepH5SXLe-I1jYhapzCcH3nogUyLMCWk0cZXnm8YD-6iJ2Bm8D-4LZqdjutcFWSXwQ3_UvBsAyNkCihqPvgfnwFeP0Tm8uAP1_uxlBDaF8otBRoPjlhxiXhAHE75caqtLA0GA682iaEkkC-RLY9q3mNr9dJkL96KmuFGmM5XoZqIyqG87E_0px9cNIbYn-zZEmTphFWuT9jVtr-mHHNuDiB68yvSng6dDIPljLWUzsAVpla-QC8zRZm7_S0',
                                bg: 'bg-tertiary-fixed'
                            }
                        ].map((step, i) => (
                            <div key={i} className="flex flex-col gap-6">
                                <div className={`w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center text-primary shadow-inner`}>
                                    <span className="material-symbols-outlined text-3xl">{step.icon}</span>
                                </div>
                                <h3 className="text-2xl font-bold font-headline text-primary">{step.title}</h3>
                                <p className="text-on-surface-variant leading-relaxed">{step.desc}</p>
                                <div className="rounded-xl overflow-hidden mt-4">
                                    <img alt={step.title} className="w-full grayscale hover:grayscale-0 transition-all duration-700" src={step.img} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SDG 2 / Mission Section */}
            <section className="bg-primary text-on-primary py-32 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary blur-[150px] rounded-full"></div>
                </div>
                <div className="max-w-7xl mx-auto px-10 relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                    <div className="rounded-[3rem] overflow-hidden border border-on-primary/10 shadow-2xl">
                        <img
                            alt="Global impact mission"
                            className="w-full aspect-square object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDah-F1cr8cQbiNJ9pqbEBgsRrSRdmtG6q2V32Q23qc3PVOzdSlfmGxQ_OxMAQEdSR8jk8kP-X2xqSmtbArq5ukZfISrQRehBG3-TrBf6ni3Y5XcIphiddj7YNvju6MPSsW0oKc_3t_EXNHNB1OuKrJFZv-OArRCI84Ek3HQoQBB0jLzTmmt1W5L-Dl6n_4whoqwPrNW-I1NuQpOzZbwuX_wW5F1kt3H8ZBoNSor-HHhsbp6NGpRka1jnKUhwmDwWwGWQ9oZc3TjBM"
                        />
                    </div>
                    <div className="flex flex-col gap-8">
                        <h2 className="text-secondary-fixed-dim font-headline text-sm font-extrabold uppercase tracking-widest">Global Mission</h2>
                        <h3 className="text-5xl lg:text-6xl font-headline font-extrabold tracking-tight">
                            Zero Hunger. <br />Zero Waste.
                        </h3>
                        <p className="text-primary-fixed/80 text-xl leading-relaxed">
                            Aligned with UN Sustainable Development Goal 2, we are on a mission to end world hunger by 2030. By optimizing the distribution of the world's 1.3 billion tons of wasted food, we solve a logistical problem to fix a human tragedy.
                        </p>
                        <ul className="flex flex-col gap-6">
                            {[
                                'Verified NGO Network across 15+ states',
                                'Real-time carbon offset tracking for corporate donors',
                                'Blockchain-verified chain of custody for every meal'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-secondary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <span className="text-lg font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Partners / Testimonials Section */}
            <section className="py-32 px-10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                        <div className="max-w-xl">
                            <h2 className="text-primary font-headline text-4xl font-extrabold mb-4">Trusted by Global Leaders</h2>
                            <p className="text-on-surface-variant">
                                We partner with the world's most innovative retailers and impactful NGOs to create a circular food economy.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button className="w-14 h-14 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-high transition-colors">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button className="w-14 h-14 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-high transition-colors">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-8">
                        {[
                            {
                                quote: "The Living Network transformed our corporate sustainability program. We went from throwing away tons of food to feeding 5,000 people weekly with zero additional overhead.",
                                name: "Sarah Chen",
                                title: "VP of Sustainability, Global Mart",
                                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAIPjJj8s2OTpTO0GXk5ziAe3LSb7dN5HavdBUVPJzDfJlUbuM62Km2LJAdUCCe3eIJh6VcVGFFJAfd2UyaoQWJoyDjoyqLFlERiHiK9487D79tkM3O_GhjmEpp62eqZ1fDHl8uV17kTdX3Z74Xy15i03LkVCPyEH7WdupOQDWPMVNVEBQ_4UbQPm7k5wfHORHxdi4bKKCxspFsaO57gyR6cqYL6hO9y08sokMohTnQY6Kdnf4E7xm6Jdjo6BcnDqz9jzrotlY1GMk"
                            },
                            {
                                quote: "Before the network, we spent 40% of our budget on logistics. Now, the logistics are automated, and we can focus 100% on serving the community.",
                                name: "Marcus Thorne",
                                title: "Director, Feeding Hope NGO",
                                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkulfhgIICiTtOgnq-ltyMh1Q_rLI0z6rF2SKtWmvN78JjCjy8yyKXWZ1c5SgLwrJ6Mk_ha8vUzqFt1o_TQYMW3CxV3H7AIdNEKyA5bCSkLoxnahs6qjuUpzzM6HGmjMLjXDSzT1hKdNw1W74zz0apn7EuZBag-8FwAd_sS7rw5THuCwTQNS2gPUx_HfWu4Gnv-wOdhrmqAs3E4h9-KmwgePfkCALAwZLGtk2Id2LLc6BFJUwuoFkE9ssWeRG-s6LK6CgmRK0RZ2Q"
                            }
                        ].map((testimonial, i) => (
                            <div key={i} className="bg-surface-container-low p-12 rounded-[2.5rem] flex flex-col gap-8 relative">
                                <span className="material-symbols-outlined text-6xl text-secondary/20 absolute top-8 right-12" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
                                <p className="text-2xl font-medium text-primary leading-relaxed italic">{testimonial.quote}</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-surface-container-highest overflow-hidden">
                                        <img alt="Testimonial profile" className="w-full h-full object-cover" src={testimonial.img} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-primary">{testimonial.name}</h4>
                                        <p className="text-sm text-on-surface-variant">{testimonial.title}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-20 flex flex-wrap justify-between items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
                        {['RETAIL CO.', 'FRESH FARMS', 'CITY LOGISTICS', 'GLOBAL FEED', 'GREEN LOG'].map((partner, i) => (
                            <h5 key={i} className="text-xl font-headline font-bold text-outline">{partner}</h5>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="max-w-7xl mx-auto px-10 pb-32">
                <div className="impact-gradient p-20 rounded-[3rem] text-on-primary text-center relative overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-secondary rounded-full blur-[120px] opacity-20"></div>
                    <div className="relative z-10 flex flex-col items-center gap-8">
                        <h2 className="text-5xl lg:text-7xl font-headline font-extrabold tracking-tight max-w-4xl">
                            Ready to make an <span className="text-secondary-fixed">actual difference?</span>
                        </h2>
                        <p className="text-xl text-primary-fixed/80 max-w-2xl">
                            Join 2,000+ organizations already saving the planet and feeding the world. Registration takes less than 5 minutes.
                        </p>
                        <div className="flex flex-wrap gap-6 justify-center">
                            <Link to={token ? dashboardPath : "/register"} className="bg-secondary-fixed text-on-secondary-fixed px-10 py-5 rounded-2xl font-bold text-xl shadow-xl shadow-black/20 hover:scale-105 transition-transform">
                                {token ? 'Go to Dashboard' : 'Join Now'}
                            </Link>
                            <button className="border-2 border-on-primary/20 text-on-primary px-10 py-5 rounded-2xl font-bold text-xl hover:bg-on-primary/10 transition-colors">
                                Book a Demo
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-surface-container-low py-20 px-10">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4 text-primary">
                            <div className="w-6 h-6">
                                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"></path>
                                </svg>
                            </div>
                            <h2 className="text-on-surface text-lg font-headline font-extrabold">The Living Network</h2>
                        </div>
                        <p className="text-on-surface-variant text-sm leading-relaxed">
                            A global intelligence layer for food redistribution. Eliminating waste through dynamic logistics and AI-driven empathy.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-primary mb-6">Platform</h4>
                        <ul className="flex flex-col gap-4 text-sm text-on-surface-variant">
                            <li><Link to="/register" className="hover:text-secondary">For Donors</Link></li>
                            <li><Link to="/register" className="hover:text-secondary">For NGOs</Link></li>
                            <li><a className="hover:text-secondary" href="#">Smart Logistics</a></li>
                            <li><a className="hover:text-secondary" href="#">API & Integrations</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-primary mb-6">Company</h4>
                        <ul className="flex flex-col gap-4 text-sm text-on-surface-variant">
                            <li><a className="hover:text-secondary" href="#">Mission</a></li>
                            <li><a className="hover:text-secondary" href="#">Impact Report</a></li>
                            <li><a className="hover:text-secondary" href="#">Partners</a></li>
                            <li><a className="hover:text-secondary" href="#">Careers</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-primary mb-6">Stay Connected</h4>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">public</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">alternate_email</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">share</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs text-on-surface-variant">© 2024 The Living Network. Built for global impact.</p>
                    <div className="flex gap-8 text-xs text-on-surface-variant">
                        <a className="hover:text-secondary" href="#">Privacy Policy</a>
                        <a className="hover:text-secondary" href="#">Terms of Service</a>
                        <a className="hover:text-secondary" href="#">Cookie Settings</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
