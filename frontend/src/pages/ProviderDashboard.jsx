import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, AlertTriangle, Activity, LogOut, UserCircle, CheckCircle, Phone, Clock, TrendingUp, Cpu, Stethoscope, ChevronRight, BarChart3, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import Logo from '../components/Logo';

const SlideUp = ({ children, delay = 0, className = '' }) => (
    <motion.div className={className}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: 'easeOut' }}>
        {children}
    </motion.div>
);

// Fake load forecasting data to simulate "AI Prediction"
const FORECAST_DATA = [
    { time: '08:00', load: 30 }, { time: '09:00', load: 85 }, { time: '10:00', load: 95 },
    { time: '11:00', load: 70 }, { time: '12:00', load: 45 }, { time: '13:00', load: 20 },
    { time: '14:00', load: 60 }, { time: '15:00', load: 80 }, { time: '16:00', load: 90 },
    { time: '17:00', load: 50 }, { time: '18:00', load: 30 },
];

export default function ProviderDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [queue, setQueue] = useState([]);
    const [todayAppts, setTodayAppts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [callingNext, setCallingNext] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchData();

        const channel = supabase
            .channel('queue-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, () => fetchData())
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user]);

    const fetchData = async () => {
        const today = new Date().toISOString().split('T')[0];

        const { data: providerRecord } = await supabase
            .from('providers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!providerRecord) { setLoading(false); return; }

        const { data: appts } = await supabase
            .from('appointments')
            .select('*, users!appointments_patient_id_fkey(full_name, email)')
            .eq('provider_id', providerRecord.id)
            .gte('scheduled_at', today + 'T00:00:00')
            .lte('scheduled_at', today + 'T23:59:59')
            .order('scheduled_at');

        setTodayAppts(appts || []);

        const { data: queueData } = await supabase
            .from('queue_entries')
            .select('*, appointments(reason, users!appointments_patient_id_fkey(full_name))')
            .eq('provider_id', providerRecord.id)
            .in('status', ['waiting', 'in_consultation'])
            .order('queue_position');

        // Add mock AI triage scores to the queue for the UI
        const enrichedQueue = (queueData || []).map((q, i) => {
            const isEmergency = q.priority === 'emergency';
            return {
                ...q,
                aiScore: isEmergency ? Math.floor(Math.random() * (99 - 90) + 90) : Math.floor(Math.random() * (75 - 20) + 20),
                triageCategory: isEmergency ? 'Critical' : i < 2 ? 'High' : 'Standard'
            };
        }).sort((a, b) => b.aiScore - a.aiScore); // Sort by highest severity first

        setQueue(enrichedQueue);
        setLoading(false);
    };

    const callNext = async () => {
        const waiting = queue.filter(q => q.status === 'waiting');
        if (!waiting.length) return;
        setCallingNext(true);
        // Assuming the highest aiScore is technically the next patient now due to routing
        await supabase.from('queue_entries').update({ status: 'in_consultation' }).eq('id', waiting[0].id);
        await fetchData();
        setCallingNext(false);
    };

    const markEmergency = async (queueEntryId) => {
        await supabase.from('queue_entries').update({ priority: 'emergency' }).eq('id', queueEntryId);
        await fetchData();
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-red-600 bg-red-100 border-red-200';
        if (score >= 60) return 'text-orange-600 bg-orange-100 border-orange-200';
        return 'text-emerald-600 bg-emerald-100 border-emerald-200';
    };

    return (
        <div className="min-h-screen bg-slate-50 font-inter flex">
            {/* Sidebar */}
            <div className="w-64 bg-slate-950 text-white flex flex-col flex-none relative z-40 overflow-hidden h-screen sticky top-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="p-6 border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-3">
                        <Logo light className="w-8 h-8" />
                        <span className="font-black text-xl tracking-tight">HealthQ</span>
                    </div>
                </div>

                <div className="p-6 relative z-10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">AI Diagnostics</p>
                    <nav className="space-y-1">
                        {[
                            { icon: Cpu, label: 'Command Center', active: true },
                            { icon: Users, label: 'Priority Routing' },
                            { icon: BarChart3, label: 'Load Forecast' },
                            { icon: Calendar, label: "Schedule Tracker" },
                        ].map(({ icon: Icon, label, active }) => (
                            <button key={label} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 ring-1 ring-blue-500' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                <Icon className="w-4 h-4" /> {label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-white/10 relative z-10">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-black text-lg">
                                {user?.user_metadata?.full_name?.charAt(0) || 'P'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate text-white">Dr. {user?.user_metadata?.full_name?.split(' ')[0] || 'Provider'}</p>
                                <p className="text-[10px] uppercase font-bold text-emerald-400 truncate flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> On Duty</p>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => { logout(); navigate('/'); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-red-500/20 transition-all border border-transparent hover:border-red-500/30">
                        <LogOut className="w-4 h-4" /> End Shift
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 p-8 lg:p-10 space-y-8 overflow-y-auto h-screen">
                {/* Header Layer */}
                <SlideUp className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1">
                                <Activity className="w-3 h-3 text-blue-600" /> Live Data Sync
                            </span>
                            <span className="text-slate-400 text-xs font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Facility Command Center</h1>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all focus:ring-2 focus:ring-slate-200 focus:outline-none">
                            Generate Report
                        </button>
                        <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Walk-in Patient
                        </button>
                    </div>
                </SlideUp>

                {/* Top KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'Total Handled', value: todayAppts.filter(a => a.status === 'completed').length + '', target: todayAppts.length, label: 'vs scheduled', icon: Users, color: 'blue' },
                        { title: 'Avg Consult Time', value: '14m', target: '15m optimal', label: '1m under target', icon: Clock, color: 'emerald' },
                        { title: 'Critical Cases', value: queue.filter(q => q.priority === 'emergency').length + '', target: 'AI Routed', label: 'Action required', icon: AlertTriangle, color: 'red' },
                        { title: 'Efficiency Score', value: '94%', target: '+2.4%', label: 'From yesterday', icon: TrendingUp, color: 'indigo' },
                    ].map((stat, i) => (
                        <SlideUp key={stat.title} delay={i * 0.05} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${stat.color}-600`}><stat.icon className="w-16 h-16 -mr-4 -mt-4" /></div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.title}</p>
                            <h3 className="text-3xl font-black text-slate-900 mb-2">{stat.value}</h3>
                            <div className="flex items-center gap-2 mt-auto">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-${stat.color}-50 text-${stat.color}-700`}>{stat.target}</span>
                                <span className="text-xs text-slate-400 font-medium">{stat.label}</span>
                            </div>
                        </SlideUp>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left/Main Col: AI Priority Queue */}
                    <div className="lg:col-span-2 space-y-6">
                        <SlideUp delay={0.2} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col h-[600px]">
                            {/* Queue Header */}
                            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <Cpu className="w-5 h-5 text-blue-600" /> AI Priority Routing
                                    </h2>
                                    <p className="text-xs text-slate-500 font-medium mt-1">Queue dynamically sorted by ML severity assessment.</p>
                                </div>
                                <button onClick={callNext} disabled={callingNext || !queue.some(q => q.status === 'waiting')}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-blue-600 text-white text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]">
                                    {callingNext ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Stethoscope className="w-4 h-4" />}
                                    Call Next Patient
                                </button>
                            </div>

                            {/* Queue List */}
                            <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50">
                                {loading ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4" />
                                        <p className="font-bold text-sm">Syncing with intake desk...</p>
                                    </div>
                                ) : queue.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4"><CheckCircle className="w-8 h-8" /></div>
                                        <p className="text-slate-900 font-black text-lg mb-1">Queue is completely clear</p>
                                        <p className="text-slate-500 text-sm font-medium max-w-xs">All scheduled and routine walk-in patients have been attended to.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 px-4 py-2">
                                        <AnimatePresence>
                                            {queue.map((entry, i) => (
                                                <motion.div key={entry.id} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                                                    className={`group relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border transition-all ${entry.status === 'in_consultation'
                                                            ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20 text-white'
                                                            : entry.priority === 'emergency'
                                                                ? 'bg-red-50/50 border-red-200 hover:border-red-300'
                                                                : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md'
                                                        }`}>

                                                    {/* In Consult Indicator */}
                                                    {entry.status === 'in_consultation' && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-300 animate-pulse" />
                                                    )}

                                                    {/* AI Triage Score Badge */}
                                                    <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-white border border-slate-100 shadow-sm relative overflow-hidden">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${entry.status === 'in_consultation' ? 'text-slate-400' : 'text-slate-400'} pt-1`}>AI</span>
                                                        <span className={`text-lg font-black leading-none pb-1 ${entry.status === 'in_consultation' ? 'text-slate-900' : getScoreColor(entry.aiScore).split(' ')[0]}`}>{entry.aiScore}</span>
                                                        <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-50 ${entry.status === 'in_consultation' ? 'bg-slate-200' : getScoreColor(entry.aiScore).split(' ')[1]}`} />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h3 className={`font-black text-base truncate ${entry.status === 'in_consultation' ? 'text-white' : 'text-slate-900'}`}>
                                                                {entry.appointments?.users?.full_name || 'Patient'}
                                                            </h3>
                                                            {entry.status === 'in_consultation' && <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-md">IN ROOM</span>}
                                                            {entry.priority === 'emergency' && entry.status !== 'in_consultation' && <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><AlertTriangle className="w-3 h-3" /> CRITICAL</span>}
                                                        </div>
                                                        <p className={`text-sm font-medium truncate ${entry.status === 'in_consultation' ? 'text-blue-100' : 'text-slate-500'}`}>
                                                            {entry.appointments?.reason || 'General Routine checkup'}
                                                        </p>
                                                    </div>

                                                    <div className="shrink-0 flex items-center gap-2">
                                                        {entry.status !== 'in_consultation' && (
                                                            <>
                                                                <button onClick={() => markEmergency(entry.id)} disabled={entry.priority === 'emergency'}
                                                                    className={`p-2.5 rounded-xl border transition-all ${entry.priority === 'emergency' ? 'bg-red-100 border-red-200 text-red-400 opacity-50 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:ring-2 hover:ring-red-100'}`}
                                                                    title="Override Triage to Emergency">
                                                                    <AlertTriangle className="w-4 h-4" />
                                                                </button>
                                                                <button className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-blue-200 transition-all flex items-center gap-1">
                                                                    View File <ChevronRight className="w-4 h-4 text-slate-400" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </SlideUp>
                    </div>

                    {/* Right Col: AI Overviews & Load Tracking */}
                    <div className="space-y-6">
                        {/* Load Forecast simulated Heatmap */}
                        <SlideUp delay={0.3} className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[50px] rounded-full pointer-events-none" />

                            <div className="flex items-center gap-2 mb-6">
                                <BarChart3 className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-300">Live Load Forecast</h3>
                            </div>

                            <div className="flex items-end justify-between h-32 gap-1.5 border-b border-white/10 pb-2 mb-4">
                                {FORECAST_DATA.map((data, idx) => (
                                    <div key={idx} className="relative w-full flex flex-col items-center justify-end h-full group">
                                        {/* Hover Tooltip */}
                                        <div className="absolute -top-8 bg-white text-slate-900 text-[10px] font-black px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none truncate">
                                            {data.load}% Vol
                                        </div>
                                        {/* Bar */}
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${data.load}%` }}
                                            transition={{ duration: 1, delay: 0.5 + (idx * 0.05) }}
                                            className={`w-full rounded-t-sm transition-colors ${data.load > 85 ? 'bg-red-500' : data.load > 60 ? 'bg-orange-400' : 'bg-indigo-500'
                                                }`}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between text-[10px] font-bold text-slate-500 font-mono">
                                <span>08:00</span>
                                <span>13:00</span>
                                <span>18:00</span>
                            </div>

                            <div className="mt-5 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                                <p className="text-xs font-semibold text-slate-300 leading-relaxed mb-2">
                                    <span className="text-white font-black">AI Insight:</span> Expect a <span className="text-red-400">22% surge</span> in critical asthma cases around 16:00 due to declining local air quality.
                                </p>
                                <button className="text-[10px] uppercase font-bold text-indigo-400 hover:text-white transition-colors">Adjust Staffing →</button>
                            </div>
                        </SlideUp>

                        {/* Facility Metrics */}
                        <SlideUp delay={0.4} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                            <h3 className="font-bold text-slate-900 mb-4">Current Capacity</h3>
                            <div className="space-y-4">
                                {[
                                    { dept: 'Emergency Room', use: 92, status: 'Critical' },
                                    { dept: 'Cardiology', use: 45, status: 'Normal' },
                                    { dept: 'General Checkup', use: 78, status: 'High' },
                                ].map((d, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs font-bold mb-1.5">
                                            <span className="text-slate-700">{d.dept}</span>
                                            <span className={d.use > 85 ? 'text-red-600' : d.use > 60 ? 'text-orange-500' : 'text-emerald-500'}>{d.use}% ({d.status})</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }} animate={{ width: `${d.use}%` }} transition={{ duration: 1, delay: 0.6 + (i * 0.1) }}
                                                className={`h-full rounded-full ${d.use > 85 ? 'bg-red-500' : d.use > 60 ? 'bg-orange-400' : 'bg-emerald-500'}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SlideUp>
                    </div>
                </div>

            </div>
        </div>
    );
}
