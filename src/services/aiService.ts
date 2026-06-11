import { GoogleGenAI } from '@google/genai';

export interface EvacuationStep {
  id: number;
  title: string;
  sub: string;
}

const getFallbackRoute = (): EvacuationStep[] => [
  { id: 1, title: 'Leave Room', sub: 'Exit your room and check the hallway.' },
  { id: 2, title: 'Locate Exits', sub: 'Look for illuminated emergency exit signs.' },
  { id: 3, title: 'Evacuate', sub: 'Proceed down the stairs. Do not use elevators.' }
];

export const generateEvacuationRoute = async (
  guestRoom: string,
  guestFloor: number,
  crisisContext: string
): Promise<EvacuationStep[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    console.warn("GEMINI_API_KEY is not set or is using the default placeholder. Using local fallback route.");
    return getFallbackRoute();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      Act as the "NexusResponse" spatial intelligence engine. 
      There is an active emergency: ${crisisContext}. 
      The guest is located in room ${guestRoom} on floor ${guestFloor}. 
      Calculate a safe, 3-step evacuation route that specifically directs them AWAY from the crisis location.
      
      Return ONLY a valid JSON array of exactly 3 objects. 
      Each object must match this interface:
      {
        "id": number, // 1 to 3
        "title": string, // Extremely short, punchy action (e.g., "Turn Left", "Enter Stairwell B")
        "sub": string // Calm, clear supporting instruction (e.g., "Proceed 20 feet away from the smoke.")
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (text) {
      const rawText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(rawText) as EvacuationStep[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Vertex AI Routing failed:", error);
  }

  // Fallback route in case of network/parse errors mapping to hardware edge-mode fallback
  return getFallbackRoute();
};
