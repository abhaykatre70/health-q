import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { signInUser, signUpUser, signInWithGoogle } from '../services/supabaseClient';
import Logo from './Logo';

const FRIENDLY_ERRORS = {
    'Email rate limit exceeded': '⏳ Too many sign-up attempts. Please wait a moment and try again.',
    'Invalid login credentials': '❌ Incorrect email or password. Please check and try again.',
    'User already registered': '✅ This email is already registered — try logging in instead.',
    'Email not confirmed': '📧 Please check your inbox and confirm your email before logging in.',
    'Unsupported provider': '⚙️ Google Login Configuration Missing. Please set up the OAuth Client ID in your Google Cloud Console and paste it into the Supabase Auth Dashboard.',
    'provider is not enabled': '⚙️ Google Login Configuration Missing. Please set up the OAuth Client ID in your Google Cloud Console and paste it into the Supabase Auth Dashboard.',
};

function getFriendlyError(msg) {
    for (const [key, friendly] of Object.entries(FRIENDLY_ERRORS)) {
        if (msg?.includes(key)) return friendly;
    }
    return msg || 'An unexpected error occurred.';
}

export default function AuthModal({ initialView = 'login', initialRole = 'patient', onClose }) {
    const [view, setView] = useState(initialView);
    const [formData, setFormData] = useState({ email: '', password: '', fullName: '', role: initialRole });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPw, setShowPw] = useState(false);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleOAuthLogin = async () => {
        setErrorMsg('');
        const { error } = await signInWithGoogle();
        if (error) setErrorMsg(getFriendlyError(error.message));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccess(false);

        try {
            if (view === 'login') {
                const { error } = await signInUser(formData.email, formData.password);
                if (error) throw error;
                onClose();
            } else {
                const { error } = await signUpUser(formData.email, formData.password, formData.fullName, formData.role);
                if (error) throw error;
                setSuccess(true);
            }
        } catch (err) {
            setErrorMsg(getFriendlyError(err.message));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <AnimatePresence>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={handleBackdropClick}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl border border-slate-100">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                            className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </motion.div>
                        <h2 className="text-2xl font-black text-slate-900 mb-3">Account Created!</h2>
                        <p className="text-slate-500 font-medium leading-relaxed mb-6">
                            Welcome to HealthQ! You can now log in using <strong>{formData.email}</strong> to access your dashboard.
                        </p>
                        <button onClick={() => { setSuccess(false); setView('login'); }}
                            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-500/20">
                            Go to Login
                        </button>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={handleBackdropClick}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">

                    <button onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10">
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8">
                        {/* Header */}
                        <div className="text-center mb-7">
                            <Logo className="w-12 h-12 mx-auto mb-4 shadow-xl shadow-blue-500/20 rounded-xl" />
                            <h2 className="text-2xl font-black text-slate-900">{view === 'login' ? 'Welcome back' : 'Create account'}</h2>
                            <p className="text-slate-500 text-sm font-medium mt-1.5">
                                {view === 'login' ? 'Sign in to access your HealthQ dashboard.' : 'Join HealthQ to coordinate your care.'}
                            </p>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {errorMsg && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3 mb-5">
                                    {errorMsg}
                                    {errorMsg.includes('Google') && (
                                        <p className="mt-2 text-xs text-red-600 font-bold bg-white/50 p-2 rounded-lg">
                                            Fix: Ensure URL in Google Cloud OAuth is <code className="bg-red-100 px-1 rounded">.../auth/v1/callback</code> (in "Authorized redirect URIs", NOT "JavaScript origins").
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Google OAuth btn */}
                        <button onClick={handleOAuthLogin}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-semibold bg-white border-2 border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-all text-slate-700 text-sm mb-5 group">
                            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px bg-slate-100" />
                            <span className="text-xs text-slate-400 font-semibold">or with email</span>
                            <div className="flex-1 h-px bg-slate-100" />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {view === 'register' && (
                                <>
                                    <div className="flex bg-slate-100 p-1.5 rounded-xl mb-5">
                                        <button type="button" onClick={() => setFormData({ ...formData, role: 'patient' })}
                                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.role === 'patient' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                                            Patient
                                        </button>
                                        <button type="button" onClick={() => setFormData({ ...formData, role: 'provider' })}
                                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.role === 'provider' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                                            Doctor / Provider
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input type="text" required value={formData.fullName}
                                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900 font-semibold text-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                                                placeholder={formData.role === 'provider' ? "Dr. Jane Doe" : "Your full name"} />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="email" required value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900 font-semibold text-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                                        placeholder="you@example.com" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type={showPw ? 'text' : 'password'} required value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900 font-semibold text-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                                        placeholder="Minimum 6 characters" />
                                    <button type="button" onClick={() => setShowPw(!showPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full mt-2 py-3.5 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-500/20 disabled:opacity-60 disabled:pointer-events-none">
                                {loading
                                    ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing…</span>
                                    : <>{view === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>
                                }
                            </button>
                        </form>

                        {/* Removed the rate limit notice since email confirmation is now disabled via dashboard */}

                        <p className="mt-6 text-center text-sm font-medium text-slate-500">
                            {view === 'login' ? "Don't have an account? " : 'Already registered? '}
                            <button onClick={() => { setView(view === 'login' ? 'register' : 'login'); setErrorMsg(''); }}
                                className="text-blue-600 hover:text-blue-700 font-bold ml-1">
                                {view === 'login' ? 'Sign up' : 'Log in'}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
