import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * Uses Gemini Flash to predict approximate wait time for a patient in queue.
 */
export async function predictWaitTime({ queuePosition, avgConsultationMinutes, bufferMinutes, emergencyCount = 0 }) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `You are a hospital wait-time estimation AI. Given the following queue parameters, provide a short, friendly, and accurate wait-time estimate in 1-2 sentences. Do NOT use markdown.

Queue position: ${queuePosition}
Average consultation duration: ${avgConsultationMinutes} minutes
Buffer time between patients: ${bufferMinutes} minutes
Emergency cases ahead: ${emergencyCount}

Respond with just the friendly estimate, e.g. "Your estimated wait is around 25 minutes. The doctor is currently attending patient 2 of 4 in queue."`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (e) {
        return `Estimated wait: ~${queuePosition * (avgConsultationMinutes + bufferMinutes)} minutes.`;
    }
}

/**
 * Uses Gemini to suggest best available appointment time from slot candidates.
 */
export async function suggestBestSlot(slots, patientReason) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const slotList = slots.map((s, i) => `Slot ${i + 1}: ${s.label} — ${s.availableCount} spots remaining`).join('\n');
        const prompt = `You are a healthcare scheduling assistant. A patient needs an appointment for: "${patientReason}". 
    
Here are the available slots:
${slotList}

Recommend the best slot and briefly explain why in 1-2 sentences. Be concise and friendly. Do NOT use markdown.`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (e) {
        return 'We recommend booking the earliest available slot for the best care experience.';
    }
}
