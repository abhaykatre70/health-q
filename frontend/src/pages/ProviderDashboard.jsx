import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, AlertTriangle, Activity, LogOut, UserCircle, CheckCircle, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';

const SlideUp = ({ children, delay = 0, className = '' }) => (
    <motion.div className={className}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: 'easeOut' }}>
        {children}
    </motion.div>
);

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

        // Real-time queue updates
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

        setQueue(queueData || []);
        setLoading(false);
    };

    const callNext = async () => {
        const waiting = queue.filter(q => q.status === 'waiting');
        if (!waiting.length) return;
        setCallingNext(true);
        await supabase.from('queue_entries').update({ status: 'in_consultation' }).eq('id', waiting[0].id);
        await fetchData();
        setCallingNext(false);
    };

    const markEmergency = async (queueEntryId) => {
        await supabase.from('queue_entries').update({ priority: 'emergency' }).eq('id', queueEntryId);
        await fetchData();
    };

    return (
        <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-60 bg-white border-r border-slate-100 z-40 flex flex-col shadow-sm">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black">H</div>
                        <span className="font-extrabold text-slate-900">HealthQ</span>
                    </div>
                    <span className="mt-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Provider View</span>
                </div>
                <nav className="p-4 flex-1 space-y-1">
                    {[
                        { icon: Activity, label: 'Overview', active: true },
                        { icon: Calendar, label: "Today's Schedule" },
                        { icon: Users, label: 'Queue Board' },
                    ].map(({ icon: Icon, label, active }) => (
                        <button key={label} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-2 mb-2">
                        <UserCircle className="w-8 h-8 text-slate-400" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{user?.user_metadata?.full_name || 'Provider'}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={() => { logout(); navigate('/'); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign out
                    </button>
                </div>
            </div>

            {/* Main */}
            <div className="ml-60 p-8 space-y-8">
                <SlideUp>
                    <h1 className="text-3xl font-black text-slate-900">Provider Dashboard</h1>
                    <p className="text-slate-500 font-medium mt-1">Live queue management and today's schedule.</p>
                </SlideUp>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6">
                    {[
                        { label: "Today's Patients", value: todayAppts.length, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
                        { label: 'In Queue', value: queue.filter(q => q.status === 'waiting').length, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
                        { label: 'In Consultation', value: queue.filter(q => q.status === 'in_consultation').length, icon: Activity, color: 'text-cyan-600 bg-cyan-50' },
                    ].map(({ label, value, icon: Icon, color }, i) => (
                        <SlideUp key={label} delay={i * 0.07}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
                            <div>
                                <p className="text-3xl font-black text-slate-900">{value}</p>
                                <p className="text-sm text-slate-500 font-semibold">{label}</p>
                            </div>
                        </SlideUp>
                    ))}
                </div>

                {/* Queue Board */}
                <SlideUp delay={0.15} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            </span>
                            Live Queue Board
                        </h2>
                        <button onClick={callNext} disabled={callingNext || !queue.some(q => q.status === 'waiting')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:pointer-events-none">
                            <Phone className="w-4 h-4" /> {callingNext ? 'Calling…' : 'Call Next Patient'}
                        </button>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-slate-400 font-medium">Loading queue…</div>
                    ) : queue.length === 0 ? (
                        <div className="p-8 text-center">
                            <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                            <p className="text-slate-400 font-medium">Queue is clear for now!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {queue.map((entry, i) => (
                                <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                    className={`flex items-center gap-4 p-5 ${entry.status === 'in_consultation' ? 'bg-blue-50' : ''}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${entry.status === 'in_consultation' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                        {entry.queue_position}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900">{entry.appointments?.users?.full_name || 'Patient'}</p>
                                        <p className="text-sm text-slate-500 font-medium">{entry.appointments?.reason || 'General consultation'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {entry.priority === 'emergency' ? (
                                            <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full border border-red-200">🚨 Emergency</span>
                                        ) : entry.status === 'in_consultation' ? (
                                            <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full border border-blue-200">In Consultation</span>
                                        ) : (
                                            <>
                                                <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full border border-amber-200">Waiting</span>
                                                <button onClick={() => markEmergency(entry.id)}
                                                    className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Mark as Emergency">
                                                    <AlertTriangle className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </SlideUp>
            </div>
        </div>
    );
}
