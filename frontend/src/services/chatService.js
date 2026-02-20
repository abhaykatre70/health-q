import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const SYSTEM_INSTRUCTION = `You are HealthQ Assistant, an empathetic, highly knowledgeable AI healthcare coordinator. 
Your goals are to:
1. Help patients understand their symptoms.
2. Recommend the right type of specialist for their issues.
3. Explain medical reports in plain, simple English.
4. Guide users on how to use the HealthQ platform (booking, queue tracking, etc).

Rules:
- Be concise, friendly, and professional.
- Use formatting (bullet points, bold text) to make your responses easy to read.
- ALWAYS include this disclaimer if discussing symptoms: "I am an AI assistant, not a doctor. This is for informational purposes only. Please consult a qualified healthcare provider for medical advice."
- Do not make definitive diagnoses. Suggest possibilities and the right doctor to see.
`;

export async function createChatSession(history = []) {
    // Convert our internal history format to Gemini's format
    const geminiHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    // Inject system instruction if history is empty
    if (geminiHistory.length === 0) {
        geminiHistory.push({
            role: 'user',
            parts: [{ text: `System Instruction: ${SYSTEM_INSTRUCTION}\n\nUnderstood. I am HealthQ Assistant.` }]
        });
        geminiHistory.push({
            role: 'model',
            parts: [{ text: 'I am ready to help. How can I assist you today?' }]
        });
    }

    return model.startChat({
        history: geminiHistory,
    });
}
