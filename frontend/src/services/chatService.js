import OpenAI from 'openai';

const GROQ_KEY = 'REDACTED';
const openai = new OpenAI({
    apiKey: GROQ_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
    dangerouslyAllowBrowser: true
});

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

export async function createChatSession(history = []) {
    let currentHistory = [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        ...history.filter(msg => (msg.role === 'user' || msg.role === 'assistant') && msg.id !== 'welcome')
            .map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            }))
    ];

    return {
        sendMessage: async (text) => {
            currentHistory.push({ role: 'user', content: text });
            const response = await openai.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: currentHistory
            });
            const reply = response.choices[0].message.content;
            currentHistory.push({ role: 'assistant', content: reply });
            return {
                response: { text: () => reply }
            };
        }
    };
}
