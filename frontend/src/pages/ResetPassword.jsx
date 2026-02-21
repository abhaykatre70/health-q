import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { supabase, updatePassword } from '../services/supabaseClient';
import Logo from '../components/Logo';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                // Recover flow initiated
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) { setError('Minimum 6 characters required.'); return; }
        if (password !== confirm) { setError('Passwords do not match.'); return; }

        setLoading(true);
        const { error: err } = await updatePassword(password);
        setLoading(false);

        if (err) {
            setError(err.message);
        } else {
            setDone(true);
            setTimeout(() => navigate('/'), 2500);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300 font-inter">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 lg:p-12 w-full max-w-md border border-slate-100 dark:border-slate-800">

                {done ? (
                    <div className="text-center py-10">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                            className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                        </motion.div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Security Updated</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Your password has been reset. Redirecting you to the portal...</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-10">
                            <Logo className="w-12 h-12 mx-auto mb-6 shadow-xl shadow-blue-500/10 rounded-xl" />
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Secure Reset</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Update your HealthQ account credentials</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3 text-red-700 dark:text-red-400 text-sm font-bold">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>{error}</p>
                                </motion.div>
                            )}

                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input type={show ? 'text' : 'password'} placeholder="New Security Key" value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-12 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-medium" required />
                                <button type="button" onClick={() => setShow(s => !s)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                    {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            <div className="relative group">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input type={show ? 'text' : 'password'} placeholder="Confirm Key" value={confirm} onChange={e => setConfirm(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-medium" required />
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full btn-primary py-4 text-lg mt-6 shadow-xl shadow-blue-500/20">
                                {loading ? (
                                    <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'Update Credentials'
                                )}
                            </button>
                        </form>
                        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">HIPAA Compliant Security Protocol</p>
                    </>
                )}
            </motion.div>
        </div>
    );
}
