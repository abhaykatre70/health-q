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

/**
 * Analyzes medical report text and returns a structured JSON summary.
 */
export async function analyzeReport(textContent) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `You are an expert, empathetic medical AI. Extract insights from this medical report.
Return ONLY a valid JSON object (no markdown formatting, no code blocks) with this exact structure:
{
  "summary": "2-3 sentences in simple English explaining the overall result",
  "priority": "Low", "Medium", "High", or "Urgent",
  "keyFindings": [
    { "name": "e.g. Hemoglobin", "value": "e.g. 11.2 g/dL", "status": "Normal" or "Abnormal" }
  ],
  "recommendation": "1 sentence on next steps"
}

REPORT TEXT:
"""
${textContent}
"""`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Clean up markdown formatting if Gemini ignored the instruction
        const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("AI Report Analysis Error:", e);
        throw new Error('Failed to analyze the report. Please try again.');
    }
}

/**
 * Triages a patient's symptoms and returns recommended specialist and urgency.
 */
export async function triageSymptoms(symptoms) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `You are an ER triage nurse AI. Analyze these symptoms: "${symptoms}".
Return ONLY a valid JSON object (no markdown) with this structure:
{
  "specialist": "e.g. Cardiologist, General Physician, ER",
  "urgency": "Low", "Medium", "High", "Critical",
  "reasoning": "1 sentence explaining why"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("AI Triage Error:", e);
        return { specialist: 'General Physician', urgency: 'Medium', reasoning: 'Could not confidently triage. Please see a general physician for initial assessment.' };
    }
}
