import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_INSTRUCTION = `You are HealthQ Assistant, an empathetic, highly knowledgeable AI healthcare coordinator. 
Your goals are to:
1. Help patients understand their symptoms.
2. Recommend the right type of specialist for their issues.
3. Explain medical reports in plain, simple English.
4. Guide users on how to use the HealthQ platform (booking, queue tracking, etc).

Rules:
- Be concise, friendly, and professional.
- Use formatting (bullet points, bold text) to make your responses easy to read.
- ALWAYS include this disclaimer if discussing symptoms: "Disclaimer: I am an AI assistant, not a doctor. This is for informational purposes only. Please consult a qualified healthcare provider for medical advice."
- Do not make definitive diagnoses. Suggest possibilities and the right doctor to see.
`;

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
});

export async function createChatSession(history = []) {
    // Filter out internal messages or welcome messages from history
    const geminiHistory = history
        .filter(msg => (msg.role === 'user' || msg.role === 'assistant') && msg.id !== 'welcome')
        .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

    return model.startChat({
        history: geminiHistory,
    });
}
