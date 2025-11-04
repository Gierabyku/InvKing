import { GoogleGenAI } from "@google/genai";
import type { InventoryItem } from '../types';

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

export const getOrganizationTips = async (item: InventoryItem): Promise<string> => {
    try {
        const genAI = getAi();
        const prompt = `Podaj zwięzłe i kreatywne pomysły na przechowywanie i organizację dla następującego przedmiotu. Sformatuj odpowiedź jako prostą listę.
        Nazwa przedmiotu: ${item.name}
        Kategoria: ${item.category || 'Brak'}
        Opis: ${item.description}
        Atrybuty/Tagi: ${item.attributes.join(', ') || 'Brak'}`;

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