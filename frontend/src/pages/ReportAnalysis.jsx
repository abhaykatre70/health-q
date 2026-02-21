import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Upload, AlertCircle, CheckCircle, Clock,
    ChevronRight, Activity, ArrowLeft, Moon, Sun, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyzeReport } from '../services/aiService';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';

export default function ReportAnalysis() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [reportText, setReportText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!reportText.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const analysis = await analyzeReport(reportText);
            setResult(analysis);
        } catch (err) {
            // Check if it's the 429 quota error to show the demo fallback UI instead of crashing
            if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('API_KEY')) {
                setResult({
                    summary: "Based on a preliminary scan of your medical report... [Demo Mode active due to AI API limit]",
                    priority: "Medium",
                    keyFindings: [
                        { name: "Demo Analysis", value: "Complete", unit: "", status: "Normal" },
                        { name: "Risk Assessment", value: "Moderate", unit: "", status: "Review Suggested" }
                    ],
                    recommendation: "Please schedule a consultation with a General Physician.",
                    disclaimer: "AI service is running in fallback mode. Verify with a real doctor."
                });
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'urgent': return 'bg-red-500 text-white';
            case 'high': return 'bg-orange-500 text-white';
            case 'medium': return 'bg-amber-400 text-slate-900';
            case 'low': return 'bg-emerald-500 text-white';
            default: return 'bg-slate-200 text-slate-700';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-inter pb-20 transition-colors duration-300">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20 transition-colors">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors mr-3">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Logo className="w-8 h-8 mr-3" />
                    <h1 className="font-black text-slate-900 dark:text-white text-lg font-bold">Report Analysis AI</h1>
                </div>
                <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors">
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="grid md:grid-cols-2 gap-8 items-start">

                    {/* Input Column */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Understand your results.</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Paste your lab or test report text below. HealthQ's medical AI will explain it in plain English, highlight abnormal values, and suggest your priority level.</p>
                        </div>

                        <form onSubmit={handleAnalyze} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all font-inter">
                            <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Report Text</span>
                            </div>
                            <textarea
                                value={reportText}
                                onChange={(e) => setReportText(e.target.value)}
                                placeholder="Paste the text from your blood test, MRI, or doctor's notes here..."
                                className="w-full h-64 p-4 resize-none outline-none text-sm text-slate-700 dark:text-slate-300 dark:bg-slate-900 placeholder:text-slate-400"
                            />
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center transition-colors">
                                <span className="text-xs text-slate-400 font-medium">Data is analyzed securely.</span>
                                <button type="submit" disabled={!reportText.trim() || loading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md shadow-blue-500/20">
                                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                                    Analyze
                                </button>
                            </div>
                        </form>

                        {error && (
                            <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-sm font-medium">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Output Column */}
                    <div>
                        <AnimatePresence mode="wait">
                            {!result && !loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4"><Activity className="w-8 h-8 text-blue-500" /></div>
                                    <h3 className="font-bold text-slate-900 mb-2">Awaiting Report</h3>
                                    <p className="text-sm text-slate-500 max-w-xs leading-relaxed">Paste your report on the left and click analyze to see AI-generated insights.</p>
                                </motion.div>
                            )}

                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="h-full min-h-[400px] border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 shadow-sm transition-colors">
                                    <div className="relative w-16 h-16 mb-6">
                                        <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                                        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                                        <Logo className="absolute inset-0 animate-pulse w-8 h-8 m-auto scale-75" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 font-inter text-xl">Analyzing Medical Data...</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">Processing key indicators and generating plain-English summary.</p>
                                </motion.div>
                            )}

                            {result && !loading && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-colors">

                                    {/* AI Header */}
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mt-10 -mr-10" />
                                        <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Logo light className="w-4 h-4 opacity-70" /> AI Insights</p>
                                        <div className="flex justify-between items-end">
                                            <h3 className="text-2xl font-black">Report Summary</h3>
                                            <div className="text-right">
                                                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider mb-1">Triage Priority</p>
                                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase shadow-sm ${getPriorityColor(result.priority)}`}>
                                                    {result.priority || 'Unknown'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-8">
                                        {/* Summary */}
                                        <div>
                                            <p className="text-slate-700 text-[15px] font-medium leading-relaxed">{result.summary}</p>
                                        </div>

                                        {/* Key Findings */}
                                        {result.keyFindings?.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                                                    <Activity className="w-3.5 h-3.5" /> Key Findings Extracted
                                                </h4>
                                                <div className="space-y-3">
                                                    {result.keyFindings.map((finding, i) => (
                                                        <div key={i} className="group relative">
                                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group-hover:border-blue-200 dark:group-hover:border-blue-500/30 transition-all font-inter">
                                                                <div>
                                                                    <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{finding.name}</p>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{finding.value} {finding.unit}</p>
                                                                </div>
                                                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${finding.status?.toLowerCase() === 'abnormal' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                                                    {finding.status}
                                                                </div>
                                                            </div>
                                                            {finding.severityScore > 7 && (
                                                                <div className="absolute -left-1 top-4 bottom-4 w-1 bg-red-500 rounded-full" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Next Steps */}
                                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-3xl p-6 transition-colors font-inter">
                                            <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Recommended Next Steps</h4>
                                            <p className="text-[15px] font-bold text-blue-900 dark:text-blue-200 leading-relaxed">{result.recommendation}</p>

                                            <button onClick={() => navigate('/book')} className="mt-5 w-full flex items-center justify-between px-5 py-3.5 bg-white dark:bg-blue-600 text-blue-700 dark:text-white font-bold text-sm rounded-2xl border border-blue-200 dark:border-transparent hover:border-blue-300 dark:hover:bg-blue-700 hover:shadow-lg dark:hover:shadow-blue-500/20 transition-all group">
                                                Book Consultation based on AI <ChevronRight className="w-4 h-4 text-blue-400 dark:text-blue-200 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-100 dark:border-slate-800 text-center transition-colors">
                                        <div className="flex items-center justify-center gap-2 text-rose-500 dark:text-rose-400 mb-2">
                                            <ShieldAlert className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Medical Disclaimer</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal max-w-sm mx-auto">
                                            {result.disclaimer || "HealthQ AI provides insights for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician."}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </main>
        </div>
    );
}
