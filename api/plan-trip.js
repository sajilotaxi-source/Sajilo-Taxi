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
        title: { type: Type.STRING, description: 'A creative and catchy title for the trip plan. For example, "A Mystical Journey to Pelling" or "Your Darjeeling Weekend Escape".' },
        description: { type: Type.STRING, description: 'A brief, engaging description of the suggested trip or itinerary. Write 2-3 sentences to inspire the user, mentioning key places and experiences.' },
        trips: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              from: { type: Type.STRING, description: 'The departure location.' },
              to: { type: Type.STRING, description: 'The arrival location.' },
              date: { type: Type.STRING, description: 'The date of travel in YYYY-MM-DD format.' },
              seats: { type: Type.NUMBER, description: 'The number of seats required.' }
            },
            required: ['from', 'to', 'date', 'seats']
          },
          description: 'An array of one or more trips that make up the plan.'
        }
      },
      required: ['title', 'description', 'trips']
    };

    const systemInstruction = `You are a creative and helpful trip planning assistant for "Sajilo Taxi," a service in Sikkim and surrounding areas. Your goal is to inspire users and create exciting travel plans based on their prompts.
- Today's date is ${new Date().toISOString().split('T')[0]}. When users say "today", "tomorrow", or a day of the week, you must calculate the exact date in YYYY-MM-DD format.
- The list of valid locations you MUST use for 'from' and 'to' fields is: ${locations.join(', ')}. If a user mentions a location not on this list, find the closest and most logical match from the list.
- If the user asks for a simple one-way or round trip, generate a plan with one trip in the 'trips' array.
- If the user asks for a multi-day trip or a more complex plan, you can generate an itinerary with multiple trips in the 'trips' array.
- Always provide a creative 'title' and an inspiring 'description' for the plan.
- For any missing details (like seats or date), make a sensible default guess (e.g., 2 seats if they say "couple" or "for me and my friend", otherwise 1 seat; today's date if not specified).
- Ensure the response is a valid JSON object matching the provided schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
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