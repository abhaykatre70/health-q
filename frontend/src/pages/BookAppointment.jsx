import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Stethoscope, Clock, Calendar, ArrowLeft, ArrowRight, Zap, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { suggestBestSlot } from '../services/aiService';

const STEPS = ['Choose Specialty', 'Select Provider', 'Pick a Slot', 'Confirm'];

function StepIndicator({ current }) {
    return (
        <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold text-sm transition-all
            ${i < current ? 'bg-blue-600 border-blue-600 text-white' :
                            i === current ? 'bg-white border-blue-600 text-blue-600' :
                                'bg-white border-slate-200 text-slate-400'}`}>
                        {i < current ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-sm font-semibold hidden md:block ${i === current ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
                    {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < current ? 'bg-blue-600' : 'bg-slate-200'}`} />}
                </div>
            ))}
        </div>
    );
}

export default function BookAppointment() {
    const { user } = useAuth();
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

    const SPECIALTIES = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Psychiatry', 'General Medicine'];

    const fetchProviders = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('providers')
            .select('*, users(full_name, email)')
            .eq('specialty', specialty)
            .eq('is_available', true);
        setProviders(data || []);
        setLoading(false);
    };

    const fetchSlots = async () => {
        if (!selectedProvider) return;
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('availability_slots')
            .select('*')
            .eq('provider_id', selectedProvider.id)
            .gte('slot_start', today)
            .eq('is_booked', false)
            .order('slot_start')
            .limit(8);

        const formatted = (data || []).map(s => ({
            ...s,
            label: new Date(s.slot_start).toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            availableCount: 1,
        }));
        setSlots(formatted);
        setLoading(false);

        if (formatted.length && reason) {
            setAiLoading(true);
            const suggestion = await suggestBestSlot(formatted.slice(0, 4), reason || 'general checkup');
            setAiSuggestion(suggestion);
            setAiLoading(false);
        }
    };

    useEffect(() => { if (step === 1 && specialty) fetchProviders(); }, [step, specialty]);
    useEffect(() => { if (step === 2 && selectedProvider) fetchSlots(); }, [step, selectedProvider]);

    const handleConfirm = async () => {
        if (!user || !selectedSlot || !selectedProvider) return;
        setBooking(true);
        const { error: apptError } = await supabase.from('appointments').insert({
            patient_id: user.id,
            provider_id: selectedProvider.id,
            scheduled_at: selectedSlot.slot_start,
            status: 'confirmed',
            reason: reason,
        });

        if (!apptError) {
            await supabase.from('availability_slots').update({ is_booked: true }).eq('id', selectedSlot.id);
            setSuccess(true);
        }
        setBooking(false);
    };

    if (success) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-12 shadow-2xl text-center max-w-md">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                    className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                </motion.div>
                <h2 className="text-3xl font-black text-slate-900 mb-3">Appointment Confirmed!</h2>
                <p className="text-slate-500 font-medium mb-2">
                    Your appointment with <strong className="text-slate-700">{selectedProvider?.users?.full_name}</strong> has been booked.
                </p>
                <p className="text-slate-500 font-medium mb-8">
                    Scheduled for <strong className="text-slate-700">{selectedSlot?.label}</strong>
                </p>
                <button onClick={() => navigate('/dashboard')} className="w-full px-6 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">
                    Go to Dashboard
                </button>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="max-w-3xl mx-auto px-6 pt-12 pb-24">
                <div className="flex items-center gap-4 mb-10">
                    <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-black text-slate-900">Book Appointment</h1>
                </div>

                <div className="mb-10">
                    <StepIndicator current={step} />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">

                        {/* Step 0: Specialty */}
                        {step === 0 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 mb-1">What specialty do you need?</h2>
                                    <p className="text-slate-500 font-medium text-sm">Select the department that matches your health concern.</p>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Reason for visit (optional)</label>
                                    <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                                        placeholder="e.g. chest pain, routine checkup..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-medium" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {SPECIALTIES.map(s => (
                                        <button key={s} onClick={() => setSpecialty(s)}
                                            className={`p-4 rounded-2xl border-2 text-left font-bold transition-all ${specialty === s ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-blue-200'}`}>
                                            <Stethoscope className="w-5 h-5 mb-2 opacity-60" />
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 1: Provider */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 mb-1">Choose a {specialty} Specialist</h2>
                                    <p className="text-slate-500 font-medium text-sm">Select from available providers.</p>
                                </div>
                                {loading ? <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-blue-600" /></div> :
                                    providers.length === 0 ? (
                                        <p className="text-slate-400 font-medium py-8 text-center">No providers available for {specialty} right now.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {providers.map(p => (
                                                <button key={p.id} onClick={() => setSelectedProvider(p)}
                                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedProvider?.id === p.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}>
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center font-black text-blue-800 text-xl">
                                                        {p.users?.full_name?.charAt(0) || 'D'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{p.users?.full_name || 'Doctor'}</p>
                                                        <p className="text-sm text-slate-500 font-medium">{p.specialty} · {p.department}</p>
                                                    </div>
                                                    <div className="ml-auto flex items-center gap-1 text-sm text-slate-400 font-semibold">
                                                        <Clock className="w-4 h-4" />{p.buffer_minutes}m buffer
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* Step 2: Slot */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 mb-1">Pick an Available Slot</h2>
                                    <p className="text-slate-500 font-medium text-sm">All times are shown in your local timezone.</p>
                                </div>
                                {aiLoading ? (
                                    <div className="flex items-center gap-2 p-4 bg-indigo-50 rounded-2xl text-indigo-600 font-semibold text-sm">
                                        <Loader className="w-4 h-4 animate-spin" /> AI is analyzing best slot for you…
                                    </div>
                                ) : aiSuggestion && (
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl">
                                        <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1"><Zap className="w-4 h-4" /> AI Recommendation</div>
                                        <p className="text-slate-700 text-sm font-medium">{aiSuggestion}</p>
                                    </div>
                                )}
                                {loading ? <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-blue-600" /></div> :
                                    slots.length === 0 ? (
                                        <p className="text-slate-400 font-medium py-8 text-center">No available slots found. Please try another provider.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {slots.map(slot => (
                                                <button key={slot.id} onClick={() => setSelectedSlot(slot)}
                                                    className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedSlot?.id === slot.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}>
                                                    <Calendar className="w-4 h-4 text-slate-400 mb-2" />
                                                    <p className="font-bold text-slate-900 text-sm leading-snug">{slot.label}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* Step 3: Confirm */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-black text-slate-900">Confirm your booking</h2>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 divide-y divide-slate-100">
                                    {[
                                        { label: 'Provider', value: selectedProvider?.users?.full_name },
                                        { label: 'Specialty', value: selectedProvider?.specialty },
                                        { label: 'Date & Time', value: selectedSlot?.label },
                                        { label: 'Reason', value: reason || 'Not specified' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex justify-between items-center p-4">
                                            <p className="text-sm font-semibold text-slate-500">{label}</p>
                                            <p className="text-sm font-bold text-slate-900">{value}</p>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleConfirm} disabled={booking}
                                    className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                                    {booking ? <><Loader className="w-4 h-4 animate-spin" /> Booking…</> : <><CheckCircle className="w-4 h-4" /> Confirm Appointment</>}
                                </button>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                    <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/dashboard')}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    {step < 3 && (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={(step === 0 && !specialty) || (step === 1 && !selectedProvider) || (step === 2 && !selectedSlot)}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:pointer-events-none">
                            Continue <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
