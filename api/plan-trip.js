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
    
    // To use your API key, set it as an environment variable named API_KEY in your deployment environment (e.g., Vercel project settings).
    // Do not hardcode the key directly in the code for security reasons.
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

    const systemInstruction = `You are an intelligent trip planning assistant for a taxi service called Sajilo Taxi. Your task is to parse the user's request and extract booking details into a valid JSON object based on the provided schema.
- The list of valid locations you must choose from is: ${locations.join(', ')}. If the user mentions a location not on this list, find the closest and most logical match from the list.
- Today's date is ${new Date().toISOString().split('T')[0]}. When users say "today", "tomorrow", or a day of the week, you must calculate the exact date in YYYY-MM-DD format.
- Always populate all fields in the JSON response. If a piece of information is missing from the user's prompt, make a sensible default guess (e.g., 1 seat, today's date).`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction,
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