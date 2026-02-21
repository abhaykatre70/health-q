import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar, Activity, Bell, ArrowRight, LogOut, Plus,
    Zap, MessageSquare, MapPin, FileText,
    Moon, Sun, AlertCircle, Brain, ShieldCheck,
    Users, Clock, CheckCircle, Loader, RefreshCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabaseClient';
import { predictWaitTime } from '../services/aiService';
import Logo from '../components/Logo';
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const SlideUp = ({ children, delay = 0, className = '' }) => (
    <motion.div className={className}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}>
        {children}
    </motion.div>
);

// Live animated heart rate monitor
function HeartRateMonitor() {
    const [data, setData] = useState(Array(20).fill(0).map(() => ({ v: 72 })));
    useEffect(() => {
        const id = setInterval(() => {
            setData(prev => [...prev.slice(1), { v: Math.round(68 + Math.sin(Date.now() / 300) * 5 + Math.random() * 6) }]);
        }, 600);
        return () => clearInterval(id);
    }, []);
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <Line type="monotone" dataKey="v" stroke="#ef4444" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </LineChart>
        </ResponsiveContainer>
    );
}

function StabilityGauge({ score = 94 }) {
    const data = [{ v: score }, { v: 100 - score }];
    return (
        <div className="relative w-20 h-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={36}
                        startAngle={90} endAngle={450} dataKey="v" stroke="none">
                        <Cell fill="rgba(255,255,255,0.9)" />
                        <Cell fill="rgba(255,255,255,0.1)" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-white leading-none">{score}</span>
                <span className="text-[8px] font-black text-blue-200 uppercase">%</span>
            </div>
        </div>
    );
}

export default function PatientDashboard() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [queueData, setQueueData] = useState([]);
    const [aiPrediction, setAiPrediction] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [queueNumber, setQueueNumber] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const [apptResult, notifResult] = await Promise.all([
                supabase
                    .from('appointments')
                    .select('*, providers(id, specialty, avg_consultation_minutes, users(full_name))')
                    .eq('patient_id', user.id)
                    .order('scheduled_at', { ascending: true }),
                supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(4),
            ]);

            const appts = apptResult.data || [];
            setAppointments(appts);
            setNotifications(notifResult.data || []);

            const upcoming = appts.find(a => a.status === 'confirmed' || a.status === 'pending');
            if (upcoming) {
                const { data: queue } = await supabase
                    .from('queue_entries')
                    .select('*, appointments(reason, users!appointments_patient_id_fkey(full_name))')
                    .eq('provider_id', upcoming.providers?.id)
                    .in('status', ['waiting', 'in_consultation'])
                    .order('queue_position');

                setQueueData(queue || []);
                const pos = queue?.findIndex(q => q.appointment_id === upcoming.id) + 1 || 1;
                setQueueNumber(pos);

                setAiLoading(true);
                try {
                    const pred = await predictWaitTime({
                        queuePosition: pos,
                        avgConsultationMinutes: upcoming.providers?.avg_consultation_minutes || 20,
                        bufferMinutes: 5,
                        emergencyCount: queue?.filter(q => q.priority === 'emergency').length || 0,
                    });
                    setAiPrediction(pred);
                } catch (_e) {
                    setAiPrediction(`Estimated wait: ~${pos * 20} minutes based on queue position #${pos}.`);
                }
                setAiLoading(false);
            } else {
                setQueueData([]);
                setQueueNumber(null);
                setAiPrediction('');
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Real-time queue updates
    useEffect(() => {
        if (!user) return;
        const channel = supabase.channel('patient-queue')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, () => fetchData())
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [user, fetchData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const NAV = [
        { icon: Calendar, label: 'Overview', path: '/dashboard', active: true },
        { icon: Calendar, label: 'Book Slot', path: '/book' },
        { icon: MessageSquare, label: 'AI Chat', path: '/chatbot' },
        { icon: FileText, label: 'Report AI', path: '/analyze' },
        { icon: MapPin, label: 'Emergency', path: '/hospitals', red: true },
    ];

    const upcomingAppt = appointments.find(a => a.status === 'confirmed' || a.status === 'pending');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

            {/* Top Nav */}
            <nav className="fixed top-0 inset-x-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-6 lg:px-10">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <Logo className="w-8 h-8" />
                    <span className="font-black text-lg text-slate-900 dark:text-white">Health<span className="text-blue-600">Q</span></span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">AI Active</span>
                    </div>
                    <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors">
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { logout(); navigate('/'); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-black hover:opacity-90 transition-opacity">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </nav>

            <div className="pt-24 pb-16 px-6 lg:px-10 max-w-7xl mx-auto flex gap-8">

                {/* Sidebar */}
                <aside className="hidden lg:flex flex-col gap-2 w-52 shrink-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] px-3 mb-2">Navigation</p>
                    {NAV.map(({ icon: Icon, label, path, active, red }) => (
                        <button key={path} onClick={() => navigate(path)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' :
                                red ? 'bg-red-50 dark:bg-red-900/10 text-red-600 border border-red-100 dark:border-red-900' :
                                    'text-slate-500 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'}`}>
                            <Icon className="w-4 h-4 shrink-0" /> {label}
                        </button>
                    ))}

                    <div className="mt-6 p-6 rounded-3xl bg-slate-900 text-white">
                        <Brain className="w-8 h-8 text-blue-400 mb-4" />
                        <p className="font-black text-sm leading-tight mb-2">Clinical AI</p>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">Analyze reports and get instant triage recommendations.</p>
                        <button onClick={() => navigate('/analyze')}
                            className="w-full py-2.5 bg-blue-600 rounded-xl text-xs font-black hover:bg-blue-700 transition-colors">
                            Analyze Report
                        </button>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 min-w-0 space-y-6">

                    <SlideUp>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Patient Dashboard</p>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                                    Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'}, {user?.user_metadata?.full_name?.split(' ')[0] || 'Patient'} 👋
                                </h1>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleRefresh} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 transition-colors">
                                    <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                </button>
                                <button onClick={() => navigate('/book')}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 text-white font-black text-sm hover:-translate-y-0.5 transition-all shadow-lg shadow-blue-500/20">
                                    <Plus className="w-4 h-4" /> Book Appointment
                                </button>
                            </div>
                        </div>
                    </SlideUp>

                    {/* AI Wait Time Card */}
                    <SlideUp delay={0.1} className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl p-7 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 opacity-5 -mr-8 -mt-8">
                            <Activity className="w-64 h-64" />
                        </div>
                        <div className="flex flex-col md:flex-row gap-5 items-center relative z-10">
                            <div className="w-24 h-24 bg-white/10 backdrop-blur rounded-3xl flex flex-col items-center justify-center border border-white/20 shrink-0">
                                {queueNumber ? (
                                    <>
                                        <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest">Queue</p>
                                        <p className="text-4xl font-black italic">#{queueNumber}</p>
                                    </>
                                ) : (
                                    <Calendar className="w-10 h-10 text-blue-200" />
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                    <span className="text-xs font-black text-blue-200 uppercase tracking-widest">AI Wait Prediction</span>
                                </div>
                                <p className="text-base font-bold leading-relaxed">
                                    {aiLoading ? 'Calculating your wait time...' :
                                        aiPrediction || 'No upcoming appointment found. Book your next visit today!'}
                                </p>
                                {upcomingAppt && (
                                    <p className="text-xs text-blue-200 font-medium">
                                        Appointment with Dr. {upcomingAppt.providers?.users?.full_name} · {upcomingAppt.providers?.specialty}
                                    </p>
                                )}
                            </div>
                            <StabilityGauge score={94} />
                        </div>
                    </SlideUp>

                    {/* Charts Row */}
                    <div className="grid md:grid-cols-2 gap-5">

                        {/* Heart Rate Monitor */}
                        <SlideUp delay={0.15} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Simulation</p>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">Heart Rate</h3>
                                </div>
                                <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Live</span>
                                </div>
                            </div>
                            <div className="h-36">
                                <HeartRateMonitor />
                            </div>
                        </SlideUp>

                        {/* Real-time Queue */}
                        <SlideUp delay={0.2} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-Time</p>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">Live Queue</h3>
                                </div>
                                <Users className="w-5 h-5 text-blue-500" />
                            </div>
                            {queueData.length > 0 ? (
                                <div className="space-y-2">
                                    {queueData.slice(0, 4).map((entry, i) => (
                                        <div key={entry.id} className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${entry.status === 'in_consultation' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${entry.status === 'in_consultation' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                                {i + 1}
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-1 truncate">
                                                {entry.appointments?.users?.full_name || 'Patient'}
                                            </p>
                                            {entry.status === 'in_consultation' && (
                                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">In Room</span>
                                            )}
                                            {entry.priority === 'emergency' && (
                                                <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase">Urgent</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-24 flex flex-col items-center justify-center text-center">
                                    <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                                    <p className="text-xs font-bold text-slate-400">Queue is clear</p>
                                    <p className="text-[10px] text-slate-400">No active queue for your upcoming appointment</p>
                                </div>
                            )}
                        </SlideUp>
                    </div>

                    {/* Appointments */}
                    <SlideUp delay={0.25} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-black text-slate-900 dark:text-white">Upcoming Appointments</h3>
                            <button onClick={() => navigate('/book')} className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                + Book New <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                        {appointments.length > 0 ? appointments.slice(0, 5).map(appt => (
                            <div key={appt.id}
                                className="px-7 py-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-black text-base group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        {(appt.providers?.users?.full_name || 'D').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white text-sm">Dr. {appt.providers?.users?.full_name || 'Unknown'}</p>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                            {appt.providers?.specialty} · {new Date(appt.scheduled_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                                    appt.status === 'completed' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                                        'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}`}>{appt.status}</span>
                            </div>
                        )) : (
                            <div className="px-7 py-14 text-center">
                                <Calendar className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                <p className="font-bold text-slate-400 mb-1">No appointments found.</p>
                                <p className="text-xs text-slate-400 mb-4">Book your first appointment to get started.</p>
                                <button onClick={() => navigate('/book')}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-colors shadow-md">
                                    Book Now
                                </button>
                            </div>
                        )}
                    </SlideUp>
                </main>

                {/* Right sidebar */}
                <aside className="hidden xl:flex flex-col gap-5 w-60 shrink-0">

                    {/* Quick Actions */}
                    <SlideUp delay={0.1} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Actions</p>
                        <div className="space-y-2">
                            {[
                                { icon: MessageSquare, label: 'AI Health Chat', path: '/chatbot', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
                                { icon: FileText, label: 'Analyze Report', path: '/analyze', color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
                                { icon: Zap, label: 'Book Appointment', path: '/book', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
                            ].map(({ icon: Icon, label, path, color }) => (
                                <button key={path} onClick={() => navigate(path)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{label}</p>
                                </button>
                            ))}
                        </div>
                    </SlideUp>

                    {/* Notifications */}
                    <SlideUp delay={0.2} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Bell className="w-4 h-4 text-blue-500" />
                            <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">Alerts</h3>
                        </div>
                        <div className="space-y-2.5">
                            {notifications.length > 0 ? notifications.map(n => (
                                <div key={n.id} className={`p-3.5 rounded-2xl border transition-colors ${!n.is_read ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                    <p className="text-xs font-black text-slate-900 dark:text-white mb-0.5">{n.title}</p>
                                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{n.body}</p>
                                </div>
                            )) : (
                                <p className="text-xs text-slate-400 text-center py-4 font-bold">No new notifications.</p>
                            )}
                        </div>
                    </SlideUp>

                    {/* Security */}
                    <SlideUp delay={0.3} className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-3xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <h3 className="font-black text-sm text-emerald-700 dark:text-emerald-400">Data Secured</h3>
                        </div>
                        <p className="text-[11px] font-medium text-emerald-600/70 leading-relaxed">AES-256 encryption · Passwords hashed via bcrypt · HIPAA compliant.</p>
                    </SlideUp>

                    {/* Emergency */}
                    <button onClick={() => navigate('/hospitals')}
                        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-3xl p-5 text-center space-y-1.5 shadow-xl shadow-red-500/20 flex flex-col items-center hover:-translate-y-1 active:scale-95 transition-all">
                        <AlertCircle className="w-7 h-7" />
                        <p className="font-black text-sm">Emergency ER</p>
                        <p className="text-[10px] text-red-200 font-medium">Find nearest hospital</p>
                    </button>
                </aside>
            </div>
        </div>
    );
}
