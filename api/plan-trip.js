import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { prompt, locations } = req.body;

    if (!prompt || !Array.isArray(locations)) {
      return res.status(400).json({ error: 'Missing or invalid prompt or locations in request body' });
    }
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY environment variable not found.");
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            from: { type: Type.STRING, description: 'The departure location.' },
            to: { type: Type.STRING, description: 'The arrival location.' },
            date: { type: Type.STRING, description: 'The date of travel in YYYY-MM-DD format.' },
            seats: { type: Type.NUMBER, description: 'The number of seats required.' },
        },
        required: ['from', 'to', 'date', 'seats']
    };

    const systemInstruction = `You are a trip planning assistant for a taxi service called Sajilo Taxi. Your task is to parse the user's request and extract booking details into a valid JSON object.
    - The list of valid locations is: ${locations.join(', ')}.
    - Today's date is ${new Date().toISOString().split('T')[0]}. If the user mentions "today", "tomorrow", or a day of the week, calculate the correct date in YYYY-MM-DD format.
    - If a location mentioned by the user is not in the valid locations list, you MUST find the closest match from the list.
    - Always return a value for all fields. If you cannot determine a value, make a reasonable guess (e.g., 1 seat).
    - The user's query is: "${prompt}".`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemInstruction,
        config: {
            responseMimeType: "application/json",
            responseSchema,
        },
    });

    const jsonStr = response.text.trim();
    const parsedData = JSON.parse(jsonStr);

    res.status(200).json(parsedData);

  } catch (error) {
    console.error('Error in plan-trip API:', error);
    res.status(500).json({ error: 'Failed to generate trip plan from AI.' });
  }
}
