import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Trash2, ArrowLeft, Loader2, Info, Activity, Stethoscope, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createChatSession } from '../services/chatService';
import Logo from '../components/Logo';

const QUICK_PROMPTS = [
    { icon: Activity, text: "I've been having headaches and dizziness. Who should I see?" },
    { icon: Stethoscope, text: "What's the difference between a cardiologist and a pulmonologist?" },
    { icon: FileText, text: "Can you help me understand my blood test report?" },
];

export default function ChatbotPage() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('healthq_chat_history');
        return saved ? JSON.parse(saved) : [{ role: 'assistant', content: 'Hi there! I am your HealthQ AI Assistant. I can help triage symptoms, suggest specialists, or explain medical terms. How can I help you today?', id: 'welcome' }];
    });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const chatSessionRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
        localStorage.setItem('healthq_chat_history', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        // Initialize chat session on mount
        const initChat = async () => {
            // Only send history to Gemini if there are actual user messages
            const userHistory = messages.filter(m => m.id !== 'welcome');
            chatSessionRef.current = await createChatSession(userHistory);
        };
        initChat();
    }, []);

    const handleSend = async (text = input) => {
        if (!text.trim() || loading) return;

        const userMsg = { role: 'user', content: text.trim(), id: Date.now().toString() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            if (!chatSessionRef.current) {
                chatSessionRef.current = await createChatSession();
            }

            const result = await chatSessionRef.current.sendMessageStream(text);

            // Create empty assistant message, then stream into it
            const assistantId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId }]);

            let fullText = '';
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullText += chunkText;
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantId ? { ...msg, content: fullText } : msg
                ));
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error connecting to my AI core. Please try again.", id: Date.now().toString(), isError: true }]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        if (window.confirm("Are you sure you want to clear your conversation history?")) {
            setMessages([{ role: 'assistant', content: 'Hi there! I am your HealthQ AI Assistant. I can help triage symptoms, suggest specialists, or explain medical terms. How can I help you today?', id: 'welcome' }]);
            localStorage.removeItem('healthq_chat_history');
            chatSessionRef.current = null; // Forces re-init on next send
        }
    };

    // Helper to render markdown-like formatting simply
    const formatMessage = (content) => {
        // Simple bold parser
        const parts = content.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-inter">
            {/* Header */}
            <header className="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <Logo className="w-8 h-8" />
                        <div>
                            <h1 className="font-black text-slate-900 leading-tight">HealthQ Assistant</h1>
                            <p className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online
                            </p>
                        </div>
                    </div>
                </div>
                <button onClick={clearChat} title="Clear Chat" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                </button>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
                {/* Disclaimer Banner */}
                <div className="max-w-3xl mx-auto bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-3 text-sm text-blue-800">
                    <Info className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
                    <p><strong>Disclaimer:</strong> This AI assistant is for informational purposes only and does not provide medical diagnoses or treatment plans. Always consult a doctor for medical advice.</p>
                </div>

                <div className="max-w-3xl mx-auto space-y-6 pb-4">
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-tr from-cyan-500 to-blue-500'}`}>
                                    {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                                </div>

                                {/* Message Bubble */}
                                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-[15px] leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : msg.isError
                                            ? 'bg-red-50 text-red-600 border border-red-200 rounded-tl-none'
                                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                    }`}>
                                    <div className="whitespace-pre-wrap">{formatMessage(msg.content)}</div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                            <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                                <div className="flex gap-1">
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-blue-400 rounded-full" />
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-blue-400 rounded-full" />
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-blue-400 rounded-full" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="flex-none bg-white border-t border-slate-200 p-4 pb-8 sm:p-6">
                <div className="max-w-3xl mx-auto text-center space-y-4">

                    {/* Quick Prompts (only show if few messages exist) */}
                    {messages.length <= 2 && (
                        <div className="flex flex-wrap gap-2 justify-center mb-4">
                            {QUICK_PROMPTS.map((prompt, i) => (
                                <button key={i} onClick={() => handleSend(prompt.text)}
                                    className="flex items-center gap-2 text-xs font-semibold bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all shadow-sm">
                                    <prompt.icon className="w-3.5 h-3.5" />
                                    {prompt.text}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Box */}
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-3xl p-2 shadow-inner focus-within:bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Describe your symptoms or ask a medical question..."
                            className="w-full bg-transparent border-none outline-none resize-none py-3 px-4 max-h-32 text-slate-800 placeholder:text-slate-400 font-medium"
                            rows={1}
                            style={{ minHeight: '48px' }}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-0.5 mt-0.5" />}
                        </button>
                    </form>
                    <p className="text-[11px] text-slate-400 font-medium">HealthQ AI can make mistakes. Check important info.</p>
                </div>
            </div>
        </div>
    );
}
