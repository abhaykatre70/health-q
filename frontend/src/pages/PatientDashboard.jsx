import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Activity, Bell, ArrowRight, LogOut, Plus, UserCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { predictWaitTime } from '../services/aiService';

const SlideUp = ({ children, delay = 0, className = '' }) => (
    <motion.div className={className}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay, ease: 'easeOut' }}>
        {children}
    </motion.div>
);

const STATUS_COLORS = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
    no_show: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function PatientDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [aiPrediction, setAiPrediction] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            // Fetch appointments
            const { data: appts } = await supabase
                .from('appointments')
                .select('*, providers(specialty, avg_consultation_minutes, buffer_minutes, users(full_name))')
                .eq('patient_id', user.id)
                .order('scheduled_at', { ascending: true });
            setAppointments(appts || []);

            // Fetch notifications
            const { data: notifs } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);
            setNotifications(notifs || []);

            setLoading(false);

            // Fetch AI prediction for upcoming appointments
            const upcoming = (appts || []).find(a => a.status === 'confirmed' || a.status === 'pending');
            if (upcoming) {
                setAiLoading(true);
                const prediction = await predictWaitTime({
                    queuePosition: 2,
                    avgConsultationMinutes: upcoming.providers?.avg_consultation_minutes || 30,
                    bufferMinutes: upcoming.providers?.buffer_minutes || 5,
                    emergencyCount: 0,
                });
                setAiPrediction(prediction);
                setAiLoading(false);
            }
        };

        fetchData();

        // Real-time subscription for notifications
        const channel = supabase
            .channel('patient-notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                (payload) => setNotifications(prev => [payload.new, ...prev.slice(0, 4)]))
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-60 bg-white border-r border-slate-100 z-40 flex flex-col shadow-sm">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-base">H</div>
                        <span className="font-extrabold text-slate-900">HealthQ</span>
                    </div>
                </div>
                <nav className="p-4 flex-1 space-y-1">
                    {[
                        { icon: Activity, label: 'Overview', active: true },
                        { icon: Calendar, label: 'Appointments' },
                        { icon: Clock, label: 'Queue Status' },
                        { icon: Bell, label: 'Notifications' },
                    ].map(({ icon: Icon, label, active }) => (
                        <button key={label} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-3 px-2">
                        <UserCircle className="w-8 h-8 text-slate-400" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{user?.user_metadata?.full_name || 'Patient'}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={() => { logout(); navigate('/'); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="ml-60 p-8 space-y-8">
                {/* Header */}
                <SlideUp className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Good evening, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'} 👋</h1>
                        <p className="text-slate-500 font-medium mt-1">Here's your health overview for today.</p>
                    </div>
                    <button onClick={() => navigate('/book')}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all">
                        <Plus className="w-4 h-4" /> New Appointment
                    </button>
                </SlideUp>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-6">
                    {[
                        { label: 'Total Appointments', value: appointments.length, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
                        { label: 'Upcoming', value: appointments.filter(a => ['pending', 'confirmed'].includes(a.status)).length, icon: Clock, color: 'text-cyan-600 bg-cyan-50' },
                        { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, icon: Activity, color: 'text-emerald-600 bg-emerald-50' },
                    ].map(({ label, value, icon: Icon, color }, i) => (
                        <SlideUp key={label} delay={i * 0.08}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
                            <div>
                                <p className="text-3xl font-black text-slate-900">{value}</p>
                                <p className="text-sm text-slate-500 font-semibold">{label}</p>
                            </div>
                        </SlideUp>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Appointments List */}
                    <SlideUp delay={0.1} className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">My Appointments</h2>
                            <button onClick={() => navigate('/book')} className="text-sm text-blue-600 font-bold hover:text-blue-700 flex items-center gap-1">
                                Book new <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400 font-medium">Loading appointments…</div>
                            ) : appointments.length === 0 ? (
                                <div className="p-8 text-center space-y-3">
                                    <Calendar className="w-10 h-10 text-slate-200 mx-auto" />
                                    <p className="text-slate-400 font-medium">No appointments yet. Book your first one!</p>
                                    <button onClick={() => navigate('/book')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
                                        Book now
                                    </button>
                                </div>
                            ) : appointments.map((appt, i) => (
                                <motion.div key={appt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                                    className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">
                                        {appt.providers?.users?.full_name?.charAt(0) || 'D'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 truncate">{appt.providers?.users?.full_name || 'Doctor'}</p>
                                        <p className="text-sm text-slate-500 font-medium">{appt.providers?.specialty} · {appt.reason || 'General consultation'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-700">{appt.scheduled_at ? new Date(appt.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</p>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[appt.status] || 'bg-slate-100 text-slate-500'}`}>
                                            {appt.status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </SlideUp>

                    {/* Right Column: AI + Notifications */}
                    <div className="space-y-6">
                        {/* AI Prediction Card */}
                        <SlideUp delay={0.15} className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="w-5 h-5" />
                                <span className="font-bold text-sm uppercase tracking-wider text-blue-200">AI Wait Prediction</span>
                            </div>
                            {aiLoading ? (
                                <div className="flex items-center gap-2 text-blue-200">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span className="font-medium text-sm">Analyzing queue data…</span>
                                </div>
                            ) : aiPrediction ? (
                                <p className="text-base font-medium leading-relaxed">{aiPrediction}</p>
                            ) : (
                                <p className="text-blue-200 text-sm font-medium">Book an appointment to get AI-powered wait time estimates.</p>
                            )}
                        </SlideUp>

                        {/* Notifications */}
                        <SlideUp delay={0.2} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 p-5 border-b border-slate-100">
                                <Bell className="w-4 h-4 text-slate-400" />
                                <h3 className="font-bold text-slate-900">Notifications</h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {notifications.length === 0 ? (
                                    <p className="p-5 text-sm text-slate-400 font-medium">No notifications yet.</p>
                                ) : notifications.map((n) => (
                                    <div key={n.id} className={`p-4 ${!n.is_read ? 'bg-blue-50/40' : ''}`}>
                                        <p className="text-sm font-bold text-slate-900">{n.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
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
