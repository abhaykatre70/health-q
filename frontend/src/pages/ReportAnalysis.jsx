import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, AlertCircle, CheckCircle, Clock, ChevronRight, Activity, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyzeReport } from '../services/aiService';
import Logo from '../components/Logo';

export default function ReportAnalysis() {
    const navigate = useNavigate();
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
            setError(err.message);
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
        <div className="min-h-screen bg-slate-50 font-inter pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center shadow-sm sticky top-0 z-20">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors mr-3">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <Logo className="w-8 h-8 mr-3" />
                <h1 className="font-black text-slate-900 text-lg">Report Analysis AI</h1>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="grid md:grid-cols-2 gap-8 items-start">

                    {/* Input Column */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Understand your results.</h2>
                            <p className="text-slate-500 font-medium leading-relaxed">Paste your lab or test report text below. HealthQ's medical AI will explain it in plain English, highlight abnormal values, and suggest your priority level.</p>
                        </div>

                        <form onSubmit={handleAnalyze} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Report Text</span>
                            </div>
                            <textarea
                                value={reportText}
                                onChange={(e) => setReportText(e.target.value)}
                                placeholder="Paste the text from your blood test, MRI, or doctor's notes here..."
                                className="w-full h-64 p-4 resize-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
                            />
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
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
                                    className="h-full min-h-[400px] border border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-8 bg-white shadow-sm">
                                    <div className="relative w-16 h-16 mb-6">
                                        <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                                        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                                        <Logo className="absolute inset-0 animate-pulse w-8 h-8 m-auto scale-75" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-2">Analyzing Medical Data...</h3>
                                    <p className="text-sm text-slate-500 max-w-xs leading-relaxed">Processing key indicators and generating plain-English summary.</p>
                                </motion.div>
                            )}

                            {result && !loading && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">

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
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Key Findings Extracted</h4>
                                                <div className="space-y-2">
                                                    {result.keyFindings.map((finding, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                            <div>
                                                                <p className="font-bold text-sm text-slate-900 leading-tight">{finding.name}</p>
                                                                <p className="text-xs text-slate-500 mt-0.5">{finding.value}</p>
                                                            </div>
                                                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${finding.status?.toLowerCase() === 'abnormal' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {finding.status}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Next Steps */}
                                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                                            <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Recommended Next Steps</h4>
                                            <p className="text-sm font-semibold text-blue-900 leading-relaxed">{result.recommendation}</p>

                                            <button onClick={() => navigate('/book')} className="mt-4 w-full flex items-center justify-between px-4 py-3 bg-white text-blue-700 font-bold text-sm rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-sm transition-all group">
                                                Book Consultation based on AI <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
                                        This AI analysis does not replace a doctor. Always consult a healthcare professional.
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
