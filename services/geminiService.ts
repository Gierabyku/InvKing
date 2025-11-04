import { GoogleGenAI } from "@google/genai";
import type { ServiceItem } from '../types';

let ai: GoogleGenAI | null = null;

const getAi = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

export const getDiagnosticTips = async (item: ServiceItem | Omit<ServiceItem, 'docId'>): Promise<string> => {
    try {
        const genAI = getAi();
        const prompt = `Jesteś asystentem serwisanta elektroniki. Na podstawie poniższego opisu usterki, podaj listę możliwych przyczyn i sugerowane kroki diagnostyczne. Bądź zwięzły i techniczny.
        Urządzenie: ${item.deviceName} ${item.deviceModel || ''}
        Klient: ${item.clientName} ${item.companyName ? `(${item.companyName})` : ''}
        Zgłoszona usterka przez klienta: "${item.reportedFault}"
        
        Sformatuj odpowiedź w następujący sposób:
        **Możliwe przyczyny:**
        - Przyczyna 1
        - Przyczyna 2
        
        **Sugerowane kroki diagnostyczne:**
        - Krok 1
        - Krok 2`;

        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
};