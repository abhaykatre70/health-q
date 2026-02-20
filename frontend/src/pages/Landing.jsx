import { motion } from 'framer-motion';
import {
    Mail, Smartphone, MapPin, Search, CalendarPlus, Activity,
    ShieldAlert, ArrowRight, ShieldCheck, Clock, LogIn
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

import heroImage from '../assets/hero_image.png';
import heroBgLight from '../assets/hero_bg_light.png';
import dashboardImage from '../assets/dashboard_mockup.png';

// ── Animation helpers ──────────────────────────────────────
const SplitText = ({ children, delay = 0, className = '' }) =>
    <span className={`inline-block whitespace-pre-wrap ${className}`}>
        {children.split('').map((ch, i) => (
            <motion.span key={i} className="inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: delay + i * 0.025, ease: 'easeOut' }}>
                {ch}
            </motion.span>
        ))}
    </span>;

const SlideUp = ({ children, delay = 0, className = '' }) => (
    <motion.div className={className}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.65, delay, ease: 'easeOut' }}>
        {children}
    </motion.div>
);

// ── Feature Card ───────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay, color = 'blue' }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
        cyan: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white',
        violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
        emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    };
    return (
        <SlideUp delay={delay}
            className="group p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-2 transition-all duration-300 flex flex-col">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${colors[color]}`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold mt-6 mb-2 text-slate-900">{title}</h3>
            <p className="text-slate-500 leading-relaxed font-medium text-sm">{desc}</p>
        </SlideUp>
    );
}

// ── Landing Page ───────────────────────────────────────────
export default function Landing() {
    const [authModal, setAuthModal] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const openDashboard = () => navigate('/dashboard');

    return (
        <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

            {/* ── Background blob ── */}
            <div className="fixed top-0 inset-x-0 h-[700px] pointer-events-none -z-10"
                style={{ backgroundImage: `url(${heroBgLight})`, backgroundSize: 'cover', backgroundPosition: 'bottom', opacity: 0.15, mixBlendMode: 'multiply' }} />
            <div className="fixed top-0 inset-x-0 h-[700px] pointer-events-none -z-10 bg-gradient-to-b from-white/50 via-white/80 to-white" />

            {/* ── Navbar ── */}
            <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 lg:px-20 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow shadow-blue-500/30">H</div>
                    <span className="font-extrabold text-slate-900 text-lg tracking-tight">HealthQ</span>
                </div>

                <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-500">
                    <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
                    <a href="#platform" className="hover:text-slate-900 transition-colors">Platform</a>
                    <a href="#providers" className="hover:text-slate-900 transition-colors">Providers</a>
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <span className="hidden md:block text-sm text-slate-500 font-medium truncate max-w-[140px]">{user.email}</span>
                            <button onClick={openDashboard} className="px-5 py-2 rounded-full text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md">Dashboard</button>
                            <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-700 font-semibold px-3 py-2 rounded-full hover:bg-slate-100 transition-colors">Log out</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setAuthModal('login')} className="hidden md:block text-sm font-semibold text-slate-600 px-4 py-2 rounded-full hover:bg-slate-100 transition-colors">Log in</button>
                            <button onClick={() => setAuthModal('register')} className="text-sm font-bold bg-slate-900 text-white px-5 py-2 rounded-full hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5">Get started →</button>
                        </>
                    )}
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="pt-36 pb-24 px-6 lg:px-20 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative h-2 w-2 rounded-full bg-blue-600" />
                        </span>
                        AI-Powered Healthcare Platform
                    </motion.div>

                    <h1 className="text-5xl lg:text-[4.5rem] font-black leading-[1.06] tracking-tight">
                        <SplitText delay={0.1}>Transform</SplitText>{' '}
                        <SplitText delay={0.45}>your</SplitText>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600">
                            <SplitText delay={0.8}>patient experience.</SplitText>
                        </span>
                    </h1>

                    <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.7 }}
                        className="text-lg text-slate-500 max-w-md leading-relaxed font-medium">
                        Smart scheduling, AI wait-time prediction, and real-time emergency routing — all in one unified healthcare platform.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 0.7 }}
                        className="flex flex-wrap gap-4">
                        <button onClick={() => user ? navigate('/book') : setAuthModal('register')}
                            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-500/25 hover:bg-blue-700 hover:-translate-y-0.5 transition-all">
                            <CalendarPlus className="w-5 h-5" /> Book Appointment
                        </button>
                        <button onClick={() => setAuthModal('register')}
                            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-700 font-bold border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 hover:-translate-y-0.5 transition-all shadow-sm">
                            Join as Provider <ArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 0.8 }}
                        className="flex items-center gap-6 text-sm font-semibold text-slate-400 pt-2">
                        <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" />HIPAA Compliant</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-500" />Live AI Predictions</span>
                        <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-violet-500" />Real-time Queue</span>
                    </motion.div>
                </div>

                {/* Hero image */}
                <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                    className="relative flex justify-center">
                    <motion.img src={heroImage} alt="HealthQ Illustration"
                        animate={{ y: [-12, 12, -12] }}
                        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                        className="w-full max-w-[480px] object-contain drop-shadow-2xl" />
                    <div className="absolute inset-1/4 bg-blue-400/20 blur-[80px] rounded-full -z-10" />
                </motion.div>
            </section>

            {/* ── Search Bar ── */}
            <section className="pb-24 px-6 lg:px-20 max-w-5xl mx-auto">
                <SlideUp className="flex flex-col sm:flex-row gap-0 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3 px-5 py-4 text-slate-400 border-b sm:border-b-0 sm:border-r border-slate-100 flex-1">
                        <Search className="w-5 h-5 flex-shrink-0" />
                        <input type="text" placeholder="Search doctors, specialties, departments…"
                            className="w-full bg-transparent outline-none text-slate-800 font-medium placeholder:text-slate-400" />
                    </div>
                    <div className="flex items-center gap-3 px-5 py-4 text-slate-400 border-b sm:border-b-0 sm:border-r border-slate-100">
                        <MapPin className="w-5 h-5 flex-shrink-0" />
                        <input type="text" placeholder="City / Zip" className="w-32 bg-transparent outline-none text-slate-800 font-medium placeholder:text-slate-400" />
                    </div>
                    <button onClick={() => user ? navigate('/book') : setAuthModal('login')}
                        className="px-8 py-4 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors m-1.5 rounded-xl">
                        Search
                    </button>
                </SlideUp>
            </section>

            {/* ── Platform Preview ── */}
            <section className="pb-32 px-6 lg:px-20 max-w-7xl mx-auto">
                <SlideUp className="rounded-3xl overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/60 bg-gradient-to-b from-slate-50 to-white p-4">
                    <img src={dashboardImage} alt="HealthQ Dashboard" className="w-full rounded-2xl object-cover h-auto" />
                </SlideUp>
            </section>

            {/* ── Features ── */}
            <section id="features" className="py-32 bg-slate-50 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-20">
                    <SlideUp className="text-center mb-20">
                        <p className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-3">Core Features</p>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                            Every feature you need.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Zero compromise.</span>
                        </h2>
                    </SlideUp>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard delay={0.05} color="blue" icon={<Smartphone className="w-6 h-6" />} title="Smart Scheduling" desc="Constraint-based bookings that automatically buffer time and prevent double-bookings." />
                        <FeatureCard delay={0.1} color="cyan" icon={<Clock className="w-6 h-6" />} title="AI Wait Prediction" desc="Gemini-powered real-time estimates that dynamically adjust to live queue data." />
                        <FeatureCard delay={0.15} color="violet" icon={<ShieldAlert className="w-6 h-6" />} title="Emergency Routing" desc="One click escalates critical cases, re-queues patients, and sends instant alerts." />
                        <FeatureCard delay={0.2} color="emerald" icon={<Mail className="w-6 h-6" />} title="Auto Reminders" desc="Celery-driven email and SMS reminders cut patient no-shows by over 80%." />
                    </div>
                </div>
            </section>

            {/* ── Platform Deep Dive ── */}
            <section id="platform" className="py-32 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-20 grid lg:grid-cols-2 gap-20 items-center">
                    <SlideUp className="rounded-3xl overflow-hidden border border-slate-100 shadow-xl bg-gradient-to-br from-blue-50 to-white p-4">
                        <img src={dashboardImage} alt="Dashboard Mockup" className="w-full rounded-2xl object-contain hover:scale-105 transition-transform duration-700" />
                    </SlideUp>
                    <div className="space-y-10">
                        <SlideUp>
                            <p className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-3">Platform Modules</p>
                            <h2 className="text-4xl font-black text-slate-900">Built for what hospitals actually need.</h2>
                        </SlideUp>
                        {[
                            { icon: <Activity className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600', title: 'Constraint-Aware Slot Allocation', desc: 'Prevents double-booking and inserts per-department buffer times based on historical load.' },
                            { icon: <ShieldAlert className="w-6 h-6" />, color: 'bg-red-50 text-red-500', title: 'Emergency Displacement Engine', desc: 'When a trauma arrives, existing queue is dynamically reordered and all patients are notified instantly via Supabase Realtime.' },
                            { icon: <ShieldCheck className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600', title: 'Role-Based Access & RLS', desc: 'Supabase Row Level Security ensures patients only ever see their own records—zero cross-contamination.' },
                        ].map(({ icon, color, title, desc }, i) => (
                            <SlideUp key={title} delay={0.1 * (i + 1)} className="flex gap-4 items-start">
                                <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center ${color}`}>{icon}</div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900">{title}</h4>
                                    <p className="text-slate-500 font-medium leading-relaxed text-sm mt-1">{desc}</p>
                                </div>
                            </SlideUp>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Footer ── */}
            <footer className="bg-slate-950 text-white py-28 px-6 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full" />
                </div>
                <div className="max-w-3xl mx-auto text-center relative z-10 space-y-8">
                    <SlideUp>
                        <h2 className="text-4xl md:text-6xl font-black leading-tight">Ready to end the wait?</h2>
                        <p className="text-slate-400 font-medium text-lg mt-4">Join thousands of patients and providers already on HealthQ.</p>
                    </SlideUp>
                    <SlideUp delay={0.1} className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={() => setAuthModal('register')} className="px-10 py-4 rounded-full font-bold bg-blue-600 hover:bg-blue-500 hover:scale-105 transition-all shadow-xl shadow-blue-500/20 text-lg">
                            Create Free Account
                        </button>
                        <button onClick={() => setAuthModal('login')} className="px-10 py-4 rounded-full font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-lg">
                            Log In
                        </button>
                    </SlideUp>
                    <SlideUp delay={0.2} className="pt-10 border-t border-white/10 text-slate-500 text-sm font-medium flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span>© 2026 HealthQ Platform. All rights reserved.</span>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                    </SlideUp>
                </div>
            </footer>

            {/* ── Auth Modal ── */}
            {authModal && <AuthModal initialView={authModal} onClose={() => setAuthModal(false)} />}
        </div>
    );
}
