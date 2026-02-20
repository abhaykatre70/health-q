import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
    Brain, Users, Zap, Clock, Calendar, Activity,
    ArrowRight, ShieldCheck, Search, CalendarPlus,
    ChevronDown, Star, TrendingUp, HeartPulse,
    BarChart2, AlertTriangle, Sparkles, Stethoscope,
    Mail, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import Logo from '../components/Logo';

// ── Scroll-reveal wrapper (safe: self-contained ref)
function Reveal({ children, className = '', delay = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px 0px' });
    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 36 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
            transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

// ── Animated number counter
function Counter({ target, suffix = '', prefix = '' }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!inView) return;
        let frame = 0;
        const total = 60;
        const timer = setInterval(() => {
            frame++;
            setCount(Math.round((frame / total) * target));
            if (frame >= total) clearInterval(timer);
        }, 16);
        return () => clearInterval(timer);
    }, [inView, target]);

    return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ── Feature card used in core platform grid
function FeatureCard({ icon, color, title, desc, delay }) {
    const bg = {
        blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
        cyan: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white',
        rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
        violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
        emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
        amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
        indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    };
    return (
        <Reveal delay={delay}
            className="group p-6 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 [&>svg]:w-5 [&>svg]:h-5 ${bg[color] || bg.blue}`}>
                {icon}
            </div>
            <h3 className="font-black text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
        </Reveal>
    );
}

// ── 5 Unique feature card
function UniqueCard({ badge, gradientFrom, gradientTo, badgeClass, icon, title, desc, delay }) {
    return (
        <Reveal delay={delay}
            className="group relative rounded-3xl p-8 bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border w-fit mb-6 ${badgeClass}`}>{badge}</span>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}>
                {icon}
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight">{title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed text-sm flex-1">{desc}</p>
        </Reveal>
    );
}

// ── Main Page ─────────────────────────────────────────────
export default function Landing() {
    const [authModal, setAuthModal] = useState(false);
    const [authRole, setAuthRole] = useState('patient');
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const openAuth = (view, role = 'patient') => {
        setAuthRole(role);
        setAuthModal(view);
    };

    return (
        <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* NAVBAR */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 lg:px-16 h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm"
            >
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                    <Logo className="w-10 h-10 group-hover:scale-105 transition-transform" />
                    <span className="font-black text-slate-900 text-xl tracking-tight">HealthQ</span>
                    <span className="hidden md:block text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">AI-Powered</span>
                </div>

                <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-500">
                    {['Features', 'Platform', 'Providers'].map(link => (
                        <a key={link} href={`#${link.toLowerCase()}`} className="hover:text-slate-900 transition-colors">{link}</a>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <button onClick={() => navigate('/dashboard')} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors">Dashboard</button>
                            <button onClick={() => { logout(); navigate('/'); }} className="text-sm font-bold text-slate-400 hover:text-slate-600 px-3 py-2 hover:bg-slate-100 rounded-full transition-colors">Log out</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => openAuth('login')} className="hidden md:block text-sm font-bold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-full hover:bg-slate-100 transition-colors">Log in</button>
                            <button onClick={() => openAuth('register')} className="text-sm font-bold bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-blue-600 transition-all shadow-md">
                                Get started →
                            </button>
                        </>
                    )}
                </div>
            </motion.nav>

            {/* HERO */}
            <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
                {/* Background blobs */}
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
                <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-cyan-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 grid lg:grid-cols-2 gap-16 items-center py-24">
                    {/* Left text */}
                    <div className="space-y-8">
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute h-full w-full rounded-full bg-blue-500 opacity-75" />
                                <span className="relative h-2 w-2 rounded-full bg-blue-600" />
                            </span>
                            Healthcare Coordination Platform · AI-First
                        </motion.div>

                        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                            className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight text-slate-900">
                            Zero wait.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600">
                                Smart care.
                            </span><br />
                            Real‑time.
                        </motion.h1>

                        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }}
                            className="text-lg text-slate-500 max-w-lg leading-relaxed font-medium">
                            HealthQ eliminates hospital wait times with constraint-based scheduling, live AI predictions, emergency routing, and automated multi-channel notifications.
                        </motion.p>

                        {/* Search */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
                            className="flex bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden hover:border-blue-200 transition-colors group">
                            <div className="flex items-center gap-3 px-4 py-4 flex-1 border-r border-slate-100">
                                <Search className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                                <input type="text" placeholder="Symptom, specialty, or doctor name…"
                                    className="w-full bg-transparent outline-none text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal text-sm" />
                            </div>
                            <button onClick={() => user ? navigate('/book') : openAuth('login')}
                                className="px-6 py-4 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap">
                                Find Care <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>

                        {/* Trust badges */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.65 }}
                            className="flex flex-wrap items-center gap-5 text-sm font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" />HIPAA Compliant</span>
                            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" />Gemini AI Powered</span>
                            <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-blue-500" />Real-time Queue</span>
                        </motion.div>

                        {/* CTAs */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
                            className="flex flex-wrap gap-4 pt-2">
                            <button onClick={() => user ? navigate('/book') : openAuth('register')}
                                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-500/25 hover:bg-blue-700 hover:-translate-y-0.5 transition-all">
                                <CalendarPlus className="w-5 h-5" /> Book Appointment
                            </button>
                            <button onClick={() => openAuth('register', 'provider')}
                                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-slate-800 font-bold border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 hover:-translate-y-0.5 transition-all shadow-md">
                                <Stethoscope className="w-5 h-5 text-blue-600" /> Join as Provider
                            </button>
                        </motion.div>
                    </div>

                    {/* Right: Premium Dashboard Mockup Animation */}
                    <motion.div initial={{ opacity: 0, x: 40, rotateY: -10 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} transition={{ duration: 1, delay: 0.3 }}
                        className="relative flex justify-center items-center min-h-[500px] perspective-1000">
                        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-100 via-cyan-50 to-indigo-100 blur-3xl opacity-70" />

                        {/* Dashboard Window Frame */}
                        <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
                            {/* Window Header */}
                            <div className="h-10 border-b border-slate-100 bg-slate-50 flex items-center px-4 gap-2">
                                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-emerald-400" /></div>
                                <div className="mx-auto bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-400 px-6 py-1">healthq.ai/dashboard</div>
                            </div>

                            {/* Dashboard Content */}
                            <div className="p-5 space-y-4 bg-slate-50/50">
                                {/* AI Notification Card */}
                                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg shadow-blue-500/20">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-blue-200 uppercase tracking-wide"><Zap className="w-3.5 h-3.5" /> AI Prediction Active</span>
                                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded flex items-center gap-1"><Clock className="w-3 h-3" /> Live</span>
                                    </div>
                                    <h4 className="text-lg font-black leading-tight">Wait time dropped to 12 mins</h4>
                                    <p className="text-sm text-blue-100 mt-1 opacity-90">Queue moving faster than average. Leave for hospital now.</p>
                                </motion.div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Queue Status Card */}
                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Position</p>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-3xl font-black text-slate-900 leading-none">#3</span>
                                            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded mb-1">Up next</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: '40%' }} animate={{ width: ['40%', '70%', '70%'] }} transition={{ duration: 5, repeat: Infinity }} className="bg-blue-500 h-full rounded-full" />
                                        </div>
                                    </div>

                                    {/* Specialist Match Card */}
                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI Triage Match</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center"><Users className="w-5 h-5 text-indigo-600" /></div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 leading-tight">Cardiology</p>
                                                <p className="text-[10px] font-semibold text-slate-400">98% Match</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Animated List */}
                                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center"><span className="text-xs font-bold text-slate-900">Live Hospital Feed</span></div>
                                    <div className="p-3 space-y-2 relative h-[120px] overflow-hidden">
                                        {[
                                            { time: 'Just now', msg: 'Emergency trauma arrived. Queue paused.', type: 'urgent' },
                                            { time: '2m ago', msg: 'Patient #2 completed consult.', type: 'normal' },
                                            { time: '5m ago', msg: 'Consultation buffer adjusted by AI.', type: 'ai' },
                                        ].map((item, i) => (
                                            <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (i * 0.2) }}
                                                className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100/50">
                                                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.type === 'urgent' ? 'bg-red-500' : item.type === 'ai' ? 'bg-violet-500' : 'bg-emerald-500'}`} />
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-700 leading-tight">{item.msg}</p>
                                                    <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{item.time}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                        {/* Gradient fade out at bottom */}
                                        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Element: Checkmark */}
                        <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                            className="absolute -right-6 top-20 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-20 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-emerald-500" /></div>
                            <div className="pr-2">
                                <p className="text-xs font-black text-slate-900 leading-tight">HIPAA</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Secured</p>
                            </div>
                        </motion.div>

                    </motion.div>
                </div>
            </section>

            {/* LIVE HOSPITAL TICKER */}
            <div className="w-full bg-blue-600 text-white overflow-hidden py-2.5 border-y border-blue-700/50 flex">
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
                    className="flex whitespace-nowrap items-center gap-8 font-semibold text-xs tracking-wide uppercase"
                >
                    {Array(10).fill('🏥 Live System Event:').map((prefix, i) => (
                        <span key={i} className="flex items-center gap-2 opacity-90"><Activity className="w-3.5 h-3.5 text-blue-200" /> {prefix} <span className="text-blue-200 font-bold">{['Patient #44 admitted to Cardiology', 'General wait time −4 mins', 'AI Triage re-routed 2 cases', 'Pediatrics load is high', 'Emergency override executed'][i % 5]}</span></span>
                    ))}
                </motion.div>
            </div>

            {/* STATS BAR */}
            <section className="py-12 bg-slate-900">
                <div className="max-w-5xl mx-auto px-6 lg:px-16">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
                        {[
                            { value: 50000, suffix: '+', label: 'Appointments Booked', icon: Calendar },
                            { value: 98, suffix: '%', label: 'Patient Satisfaction', icon: Star },
                            { value: 67, suffix: 'min', prefix: '−', label: 'Wait Time Reduction', icon: Clock },
                            { value: 200, suffix: '+', label: 'Hospitals Connected', icon: ShieldCheck },
                        ].map(({ value, suffix, label, icon: Icon, prefix = '' }, i) => (
                            <Reveal key={label} delay={i * 0.08} className="space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                                    <Icon className="w-6 h-6 text-blue-400" />
                                </div>
                                <p className="text-4xl font-black">
                                    <Counter target={value} suffix={suffix} prefix={prefix} />
                                </p>
                                <p className="text-sm font-semibold text-slate-400">{label}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5 UNIQUE FEATURES */}
            <section id="features" className="py-20 bg-slate-50 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-16">
                    <Reveal className="text-center mb-12 max-w-3xl mx-auto">
                        <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-4 block">What makes us different</span>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                            5 innovations nobody else has built.
                        </h2>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed">Built specifically for healthcare coordination challenges in India and globally.</p>
                    </Reveal>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <UniqueCard delay={0}
                            badge="🧠 Unique Feature #1"
                            gradientFrom="#2563eb" gradientTo="#4f46e5"
                            badgeClass="bg-blue-100 text-blue-700 border-blue-200"
                            icon={<Brain className="w-7 h-7" />}
                            title="Symptom-to-Specialist AI Router"
                            desc="Type any symptom in plain language and Gemini AI instantly identifies the right specialist, required tests, estimated urgency level, and books the most appropriate slot based on your location." />
                        <UniqueCard delay={0.08}
                            badge="🚨 Unique Feature #2"
                            gradientFrom="#f43f5e" gradientTo="#dc2626"
                            badgeClass="bg-rose-100 text-rose-700 border-rose-200"
                            icon={<AlertTriangle className="w-7 h-7" />}
                            title="Predictive No-Show Engine"
                            desc="Our ML model analyzes 14+ behavioral signals to flag patients at 80%+ no-show risk. The system auto-contacts waitlisted patients to fill the slot before it is wasted." />
                        <UniqueCard delay={0.16}
                            badge="👥 Unique Feature #3"
                            gradientFrom="#06b6d4" gradientTo="#0d9488"
                            badgeClass="bg-cyan-100 text-cyan-700 border-cyan-200"
                            icon={<Users className="w-7 h-7" />}
                            title="Crowd-Verified Wait Times"
                            desc="After visits, patients confirm or correct AI wait estimates. Verified data trains the model in real-time. High-verification hospitals earn a Transparent Care trust badge." />
                        <UniqueCard delay={0.24}
                            badge="👨‍👩‍👧 Unique Feature #4"
                            gradientFrom="#7c3aed" gradientTo="#9333ea"
                            badgeClass="bg-violet-100 text-violet-700 border-violet-200"
                            icon={<Users className="w-7 h-7" />}
                            title="Family Health Orchestrator"
                            desc="Book appointments for your entire family in one flow. AI detects conflicts, groups visits at the same hospital, and creates a unified family health calendar with shared reminders." />
                        <UniqueCard delay={0.32}
                            badge="📊 Unique Feature #5"
                            gradientFrom="#f59e0b" gradientTo="#ea580c"
                            badgeClass="bg-amber-100 text-amber-700 border-amber-200"
                            icon={<BarChart2 className="w-7 h-7" />}
                            title="Department Load Forecasting"
                            desc="Providers see a 7-day predictive heatmap of expected patient loads driven by historical trends, seasonal illness data, and local event calendars. Proactive, not reactive." />
                        <Reveal delay={0.4}
                            className="rounded-3xl p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col justify-between shadow-2xl shadow-blue-500/20 hover:-translate-y-2 transition-transform duration-500">
                            <div>
                                <span className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4 block">Full Ecosystem</span>
                                <h3 className="text-2xl font-black mb-3 leading-tight">+ 20 more built-in modules</h3>
                                <p className="text-blue-100 font-medium leading-relaxed text-sm">Real-time queue management, emergency displacement, Celery reminders, Supabase RLS security, role-based access, and live provider availability.</p>
                            </div>
                            <button onClick={() => openAuth('register')}
                                className="mt-8 flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors w-fit text-sm">
                                Get full access <ArrowRight className="w-4 h-4" />
                            </button>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="platform" className="py-20 bg-white border-t border-slate-100">
                <div className="max-w-5xl mx-auto px-6 lg:px-16">
                    <Reveal className="text-center mb-12">
                        <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-4 block">How it works</span>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                            From symptom to care in <span className="text-blue-600">3 steps.</span>
                        </h2>
                    </Reveal>
                    <div className="grid md:grid-cols-3 gap-10">
                        {[
                            { num: '01', icon: <Brain className="w-6 h-6" />, title: 'Describe & Match', desc: 'Type your symptoms. AI routes you to the right specialist, urgency level, and pre-orders relevant tests.' },
                            { num: '02', icon: <CalendarPlus className="w-6 h-6" />, title: 'Smart Book', desc: 'Pick from AI-suggested optimal slots. Zero conflicts, dynamic buffers, family coordination built in.' },
                            { num: '03', icon: <HeartPulse className="w-6 h-6" />, title: 'Track & Arrive', desc: 'Get live queue position updates, AI wait predictions, and a real-time push notification when it is your turn.' },
                        ].map(({ num, icon, title, desc }, i) => (
                            <Reveal key={num} delay={i * 0.12} className="text-center group">
                                <div className="w-20 h-20 rounded-3xl bg-white border-2 border-slate-100 shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:border-blue-200 group-hover:shadow-xl transition-all duration-500 relative">
                                    <span className="absolute -top-3 -right-3 w-7 h-7 text-xs font-black bg-blue-600 text-white rounded-full flex items-center justify-center">{num}</span>
                                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                        {icon}
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-3">{title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed text-sm max-w-xs mx-auto">{desc}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* CORE FEATURES GRID */}
            <section className="py-16 bg-slate-50 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-16">
                    <Reveal className="mb-12 text-center">
                        <h2 className="text-3xl lg:text-4xl font-black text-slate-900">The complete platform stack.</h2>
                    </Reveal>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <FeatureCard delay={0} color="blue" icon={<Stethoscope />} title="Smart Scheduling" desc="24/7 constraint-aware booking with automatic conflict prevention." />
                        <FeatureCard delay={0.05} color="cyan" icon={<Clock />} title="AI Wait Prediction" desc="Gemini Flash models queue depth in real-time with 96%+ accuracy." />
                        <FeatureCard delay={0.1} color="rose" icon={<AlertTriangle />} title="Emergency Override" desc="Trauma cases displace queue with one click + Realtime re-alerts." />
                        <FeatureCard delay={0.15} color="violet" icon={<Mail />} title="Multi-channel Alerts" desc="Celery-driven SMS, email, and push reminders sent automatically." />
                        <FeatureCard delay={0.2} color="emerald" icon={<Shield />} title="RLS Security" desc="Supabase row-level policies ensure zero data cross-contamination." />
                        <FeatureCard delay={0.25} color="amber" icon={<Brain />} title="AI Slot Suggester" desc="Gemini recommends the optimal booking based on your health reason." />
                        <FeatureCard delay={0.3} color="blue" icon={<Users />} title="Provider Profiles" desc="Ratings, specialty info, real-time availability — all public-facing." />
                        <FeatureCard delay={0.35} color="indigo" icon={<BarChart2 />} title="Load Forecasting" desc="7-day predictive heatmaps for hospital capacity planning." />
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="py-16 bg-white border-t border-slate-100 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-16 mb-12 text-center">
                    <Reveal>
                        <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-4 block">Real Impact</span>
                        <h2 className="text-3xl lg:text-4xl font-black text-slate-900">What doctors & patients say.</h2>
                    </Reveal>
                </div>
                <div className="flex gap-6 px-6 pb-8 overflow-x-auto snap-x snap-mandatory hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {[
                        { tag: 'Chief of Cardiology', name: 'Dr. Anand Sharma', text: 'HealthQ’s priority routing algorithm automatically flags critical trauma cases and pauses the routine queue. It’s saved lives in our ER.' },
                        { tag: 'Parent of 2', name: 'Priya Mehra', text: 'I booked a pediatrician and a dentist for my kids on the same morning. The Family Orchestrator perfectly aligned the slots so I only made one trip.' },
                        { tag: 'Hospital Administrator', name: 'Rajiv Desai', text: 'The load forecasting dashboard is incredibly accurate. We now schedule our nursing staff based on the 7-day predicted heatmap.' },
                        { tag: 'Verified Patient', name: 'Amit Kumar', text: 'The AI wait time prediction was spot on. I arrived exactly 5 minutes before my consultation began. Completely eliminates the stress of waiting rooms.' },
                    ].map((t, i) => (
                        <Reveal key={i} delay={i * 0.1} className="snap-center shrink-0 w-[340px] md:w-[400px]">
                            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl h-full flex flex-col justify-between hover:bg-white hover:border-blue-100 hover:shadow-xl transition-all duration-300 group">
                                <div>
                                    <div className="flex gap-1 mb-6 text-amber-400">
                                        <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
                                    </div>
                                    <p className="text-slate-700 font-medium leading-relaxed italic">"{t.text}"</p>
                                </div>
                                <div className="mt-8 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">{t.name.charAt(0)}</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{t.name}</h4>
                                        <span className="text-xs font-semibold text-slate-400">{t.tag}</span>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* CTA FOOTER */}
            <footer className="relative py-16 bg-slate-950 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="relative z-10 max-w-3xl mx-auto px-6 text-center text-white space-y-8">
                    <Reveal>
                        <div className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full px-4 py-2 mb-6">
                            <Sparkles className="w-4 h-4" /> Trusted by 200+ hospitals across India
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black leading-tight">
                            Skip the line.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Start healing faster.</span>
                        </h2>
                        <p className="text-slate-400 font-medium text-xl mt-4">Join HealthQ free. No credit card needed.</p>
                    </Reveal>
                    <Reveal delay={0.1} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <button onClick={() => openAuth('register')}
                            className="px-10 py-5 rounded-2xl font-bold text-lg bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5 transition-all shadow-2xl shadow-blue-500/25">
                            Create Free Account
                        </button>
                        <button onClick={() => openAuth('login')}
                            className="px-10 py-5 rounded-2xl font-bold text-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:-translate-y-0.5 transition-all">
                            Log In
                        </button>
                    </Reveal>
                    <Reveal delay={0.2} className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm font-medium">
                        <span>© 2026 HealthQ Platform. All rights reserved.</span>
                        <div className="flex gap-6">
                            {['Privacy', 'Terms', 'HIPAA', 'Contact'].map(l => (
                                <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </footer>

            {/* AUTH MODAL */}
            <AnimatePresence mode="wait">
                {authModal && <AuthModal initialView={authModal} initialRole={authRole} onClose={() => setAuthModal(false)} />}
            </AnimatePresence>
        </div>
    );
}
