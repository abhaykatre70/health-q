import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { signInUser, signUpUser, signInWithGoogle } from '../services/supabaseClient';

export default function AuthModal({ initialView = 'login', onClose }) {
    const [view, setView] = useState(initialView);
    const [formData, setFormData] = useState({ email: '', password: '', fullName: '', role: 'patient' });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleOAuthLogin = async () => {
        const { error } = await signInWithGoogle();
        if (error) setErrorMsg(error.message);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            if (view === 'login') {
                const { error } = await signInUser(formData.email, formData.password);
                if (error) throw error;
                onClose(); // success
            } else {
                const { error } = await signUpUser(formData.email, formData.password, formData.fullName, formData.role);
                if (error) throw error;
                // successfully registered
                setView('login');
                setErrorMsg("Successfully registered. Please log in.");
            }
        } catch (err) {
            setErrorMsg(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleBackdropClick}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20 mx-auto mb-4">H</div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                {view === 'login' ? 'Welcome Back' : 'Create an Account'}
                            </h2>
                            <p className="text-slate-500 mt-2 font-medium">
                                {view === 'login' ? 'Enter your details to access your dashboard.' : 'Join the HealthQ ecosystem to coordinate care.'}
                            </p>
                        </div>

                        {errorMsg && (
                            <div className={`p-3 rounded-xl mb-6 text-sm font-medium ${errorMsg.includes('Success') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {view === 'register' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700">Full Name</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><User className="w-5 h-5" /></span>
                                            <input
                                                type="text"
                                                required
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 font-medium placeholder:font-normal"
                                                placeholder="Dr. Jane Doe"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700">Account Type</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 font-medium"
                                        >
                                            <option value="patient">Patient</option>
                                            <option value="provider">Healthcare Provider</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Mail className="w-5 h-5" /></span>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 font-medium placeholder:font-normal"
                                        placeholder="hello@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Password</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Lock className="w-5 h-5" /></span>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 font-medium placeholder:font-normal"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 mt-2 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                            >
                                {loading ? 'Processing...' : (view === 'login' ? 'Sign In' : 'Create Account')}
                                {!loading && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <button
                                onClick={handleOAuthLogin}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-semibold bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all text-slate-700"
                            >
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                Continue with Google
                            </button>
                        </div>

                        <p className="mt-8 text-center text-sm font-medium text-slate-500">
                            {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => { setView(view === 'login' ? 'register' : 'login'); setErrorMsg(""); }}
                                className="text-blue-600 hover:text-blue-700 font-bold ml-1 transition-colors"
                            >
                                {view === 'login' ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
