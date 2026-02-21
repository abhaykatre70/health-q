import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, Stethoscope, Clock, Calendar,
    ArrowLeft, ArrowRight, Zap, Loader, Moon, Sun,
    Search, Activity, FileText, UserCircle, RefreshCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabaseClient';
import { suggestBestSlot } from '../services/aiService';
import Logo from '../components/Logo';

const STEPS = ['Choose Specialty', 'Select Doctor', 'Pick a Slot', 'Confirm'];

const SPECIALTIES = [
    { name: 'Cardiology', icon: '❤️', desc: 'Heart & cardiovascular' },
    { name: 'Neurology', icon: '🧠', desc: 'Brain & nervous system' },
    { name: 'Pediatrics', icon: '👶', desc: 'Children\'s health' },
    { name: 'Orthopedics', icon: '🦴', desc: 'Bones & joints' },
    { name: 'Dermatology', icon: '🩺', desc: 'Skin conditions' },
    { name: 'Psychiatry', icon: '💭', desc: 'Mental health' },
    { name: 'General Medicine', icon: '🏥', desc: 'General checkup' },
    { name: 'Radiology', icon: '📷', desc: 'Imaging & scans' },
    { name: 'Gastroenterology', icon: '🫁', desc: 'Digestive system' },
    { name: 'Ophthalmology', icon: '👁️', desc: 'Eyes & vision' },
];

function StepIndicator({ current }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-10">
            {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-2xl border-2 font-black text-xs transition-all duration-300
                        ${i < current ? 'bg-emerald-500 border-emerald-500 text-white' :
                            i === current ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/10' :
                                'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                        {i < current ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest hidden md:block ${i === current ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{label}</span>
                    {i < STEPS.length - 1 && <div className={`w-8 h-0.5 rounded-full ${i < current ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                </div>
            ))}
        </div>
    );
}

export default function BookAppointment() {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [specialty, setSpecialty] = useState('');
    const [providers, setProviders] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [reason, setReason] = useState('');
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [booking, setBooking] = useState(false);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const fetchProviders = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('providers')
            .select('*, users(full_name, email)')
            .eq('specialty', specialty);
        setProviders(data || []);
        setLoading(false);
    };

    const fetchSlots = async () => {
        if (!selectedProvider) return;
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        const { data: slotData } = await supabase
            .from('availability_slots')
            .select('*')
            .eq('provider_id', selectedProvider.id)
            .gte('slot_start', today + 'T00:00:00')
            .eq('is_booked', false)
            .order('slot_start')
            .limit(12);

        const formatted = (slotData || []).map((s) => {
            const d = new Date(s.slot_start);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            return {
                ...s,
                label: `${dayName}, ${monthDay}, ${timeStr}`,
                dayName,
                monthDay,
                timeStr,
                slotDate: s.slot_start,
            };
        });

        setSlots(formatted);
        setLoading(false);

        if (formatted.length && reason) {
            setAiLoading(true);
            try {
                const suggestion = await suggestBestSlot({
                    symptoms: reason,
                    availableSlots: formatted.slice(0, 6),
                    specialty,
                });
                if (suggestion?.reason) setAiSuggestion(suggestion.reason);
            } catch (_e) {
                // silent fail
            }
            setAiLoading(false);
        }
    };

    useEffect(() => { if (step === 1 && specialty) fetchProviders(); }, [step, specialty]);
    useEffect(() => { if (step === 2 && selectedProvider) fetchSlots(); }, [step, selectedProvider]);

    const handleConfirm = async () => {
        if (!user || !selectedSlot || !selectedProvider) return;
        setBooking(true);
        try {
            const scheduledAt = selectedSlot.slotDate;

            const { error: apptError } = await supabase.from('appointments').insert({
                patient_id: user.id,
                provider_id: selectedProvider.id,
                scheduled_at: scheduledAt,
                status: 'confirmed',
                reason: reason || 'General Consultation',
            });

            if (!apptError) {
                // Mark slot as booked
                await supabase.from('availability_slots')
                    .update({ is_booked: true })
                    .eq('id', selectedSlot.id);

                // Add a notification
                await supabase.from('notifications').insert({
                    user_id: user.id,
                    title: '✅ Appointment Confirmed!',
                    body: `Your appointment with Dr. ${selectedProvider?.users?.full_name} has been booked for ${selectedSlot.label}.`,
                    is_read: false,
                });
                setSuccess(true);
            } else {
                console.error('Booking error:', apptError);
                alert('Booking failed: ' + apptError.message);
            }
        } catch (err) {
            console.error('Unexpected:', err);
            alert('Something went wrong. Please try again.');
        } finally {
            setBooking(false);
        }
    };

    const filteredProviders = providers.filter(p =>
        (p.users?.full_name || '').toLowerCase().includes(search.toLowerCase())
    );

    if (success) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6 transition-colors duration-300">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-12 shadow-2xl text-center max-w-md border border-slate-100 dark:border-slate-800">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                    className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                </motion.div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Appointment Booked!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">
                    Confirmed with <strong className="text-blue-600">Dr. {selectedProvider?.users?.full_name}</strong>
                </p>
                <p className="text-sm text-slate-400 font-bold mb-8">{selectedSlot?.label}</p>
                <div className="space-y-3">
                    <button onClick={() => navigate('/dashboard')}
                        className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                        Go to Dashboard →
                    </button>
                    <button onClick={() => { setSuccess(false); setStep(0); setSpecialty(''); setSelectedProvider(null); setSlots([]); setSelectedSlot(null); setReason(''); }}
                        className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        Book Another
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Nav */}
            <nav className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/dashboard')}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
                        <Logo className="w-7 h-7" />
                        <span className="font-black text-slate-900 dark:text-white">Health<span className="text-blue-600">Q</span></span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors">
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Smart Scheduling</p>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Book an Appointment</h1>
                </div>

                {/* Symptoms input - always visible */}
                {step === 0 && (
                    <div className="mb-6 p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                        <label className="block text-xs font-black uppercase tracking-widest text-blue-600 mb-2">Describe Your Symptoms (Optional — helps AI suggest the right doctor)</label>
                        <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                            placeholder="e.g. chest pain, headaches, skin rash..."
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:text-white font-medium text-sm transition-all" />
                    </div>
                )}

                <StepIndicator current={step} />

                <AnimatePresence mode="wait">
                    <motion.div key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-lg p-8">

                        {/* Step 0: Specialty */}
                        {step === 0 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Select a Specialty</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Choose the medical department that matches your needs.</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {SPECIALTIES.map(sp => (
                                        <button key={sp.name}
                                            onClick={() => { setSpecialty(sp.name); setStep(1); }}
                                            className={`group p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${specialty === sp.name ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md'}`}>
                                            <div className="text-2xl mb-2">{sp.icon}</div>
                                            <p className="font-black text-slate-900 dark:text-white text-sm leading-tight">{sp.name}</p>
                                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{sp.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 1: Provider */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Select a Doctor</h2>
                                    <p className="text-sm text-slate-500 font-medium">Available {specialty} specialists</p>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name..."
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors font-medium" />
                                </div>
                                {loading ? (
                                    <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
                                        <Loader className="w-7 h-7 animate-spin text-blue-500" />
                                        <p className="text-sm font-bold">Loading doctors...</p>
                                    </div>
                                ) : filteredProviders.length > 0 ? (
                                    <div className="grid md:grid-cols-2 gap-3">
                                        {filteredProviders.map(p => (
                                            <button key={p.id}
                                                onClick={() => { setSelectedProvider(p); setStep(2); }}
                                                className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 ${selectedProvider?.id === p.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200'}`}>
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center text-blue-600 font-black text-lg shrink-0">
                                                    {(p.users?.full_name || 'D').charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-slate-900 dark:text-white leading-tight truncate">Dr. {p.users?.full_name}</p>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{p.specialty}</p>
                                                    {p.bio && <p className="text-xs text-slate-400 mt-1 truncate">{p.bio}</p>}
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Available</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <UserCircle className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                        <p className="font-bold text-slate-400">No doctors found for {specialty}</p>
                                        <p className="text-xs text-slate-400 mt-1">Try a different specialty or check back later.</p>
                                        <button onClick={() => setStep(0)} className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700">← Change Specialty</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Slots */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Pick a Time Slot</h2>
                                        <p className="text-sm text-slate-500 font-medium">Available slots for Dr. {selectedProvider?.users?.full_name}</p>
                                    </div>
                                    {aiLoading && (
                                        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-xl">
                                            <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">AI Analyzing...</span>
                                        </div>
                                    )}
                                </div>
                                {aiSuggestion && (
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex items-start gap-3">
                                        <Zap className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                        <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400 leading-relaxed"><strong>AI Tip:</strong> {aiSuggestion}</p>
                                    </div>
                                )}
                                {loading ? (
                                    <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
                                        <Loader className="w-7 h-7 animate-spin text-blue-500" />
                                        <p className="text-sm font-bold">Loading available slots...</p>
                                    </div>
                                ) : slots.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {slots.map(s => (
                                            <button key={s.id}
                                                onClick={() => setSelectedSlot(s)}
                                                className={`p-4 rounded-2xl border-2 text-center transition-all hover:-translate-y-0.5 ${selectedSlot?.id === s.id ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-200 hover:shadow-md'}`}>
                                                <Calendar className={`w-4 h-4 mx-auto mb-1.5 ${selectedSlot?.id === s.id ? 'text-blue-100' : 'text-slate-400'}`} />
                                                <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${selectedSlot?.id === s.id ? 'text-blue-100' : 'text-slate-400'}`}>{s.dayName}, {s.monthDay}</p>
                                                <p className="font-black text-sm">{s.timeStr}</p>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <Clock className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                        <p className="font-bold text-slate-400">No available slots</p>
                                        <button onClick={() => setStep(1)} className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700">← Choose Different Doctor</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Confirm */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Confirm Booking</h2>
                                    <p className="text-sm text-slate-500 font-medium">Review your appointment details before confirming.</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                                    {[
                                        { label: 'Doctor', value: `Dr. ${selectedProvider?.users?.full_name}`, icon: '👨‍⚕️' },
                                        { label: 'Specialty', value: selectedProvider?.specialty, icon: '🩺' },
                                        { label: 'Date & Time', value: selectedSlot?.label, icon: '📅' },
                                        { label: 'Reason', value: reason || 'General Consultation', icon: '📝' },
                                    ].map(({ label, value, icon }) => (
                                        <div key={label} className="flex items-center gap-4 p-5">
                                            <span className="text-xl">{icon}</span>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                                                <p className="font-black text-slate-900 dark:text-white text-sm">{value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleConfirm} disabled={booking}
                                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 disabled:opacity-60 disabled:pointer-events-none transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                                    {booking ? (
                                        <><Loader className="w-5 h-5 animate-spin" /> Confirming...</>
                                    ) : (
                                        <><CheckCircle className="w-5 h-5" /> Confirm Appointment</>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                    <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/dashboard')}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    {step < 3 && (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={(step === 0 && !specialty) || (step === 1 && !selectedProvider) || (step === 2 && !selectedSlot)}
                            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-md shadow-blue-500/20">
                            Continue <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
