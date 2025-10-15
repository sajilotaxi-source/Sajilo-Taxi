
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

/**
 * A wrapper for the Gemini API call that includes a retry mechanism with exponential backoff.
 * This makes the function more resilient to transient network issues.
 * @param {GoogleGenAI} ai - The GoogleGenAI client instance.
 * @param {object} params - The parameters for the generateContent call.
 * @param {number} retries - The maximum number of retries.
 * @param {number} delay - The initial delay between retries in milliseconds.
 * @returns {Promise<GenerateContentResponse>}
 */
async function generateWithRetry(ai, params, retries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            // Attempt the API call
            return await ai.models.generateContent(params);
        } catch (error) {
            lastError = error;
            // Check if the error seems to be a retryable network error
            if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('connect'))) {
                // If this was the last attempt, break the loop to throw the error
                if (i === retries - 1) {
                    break;
                }
                console.error(`Attempt ${i + 1} failed with network error:`, error.message, `Retrying in ${delay / 1000}s...`);
                // Wait for the specified delay
                await new Promise(res => setTimeout(res, delay));
                // Increase the delay for the next retry (exponential backoff)
                delay *= 2;
            } else {
                // If it's not a network error, fail immediately
                throw error;
            }
        }
    }
    // If all retries failed, throw the last captured error
    throw lastError;
}

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

    const createTripPlanFunctionDeclaration: FunctionDeclaration = {
      name: 'createTripPlan',
      description: 'Creates a structured trip plan based on a user request.',
      parameters: {
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
      }
    };

    const systemInstruction = `You are a creative and helpful trip planning assistant for "Sajilo Taxi," a service in Sikkim and surrounding areas.
- Your goal is to understand the user's request and call the 'createTripPlan' function with the appropriate arguments.
- Today's date is ${new Date().toISOString().split('T')[0]}. When users say "today", "tomorrow", or a day of the week, you must calculate the exact date in YYYY-MM-DD format.
- The list of valid locations you MUST use for 'from' and 'to' fields is: ${locations.join(', ')}. If a user mentions a location not on this list, find the closest and most logical match from the list.
- If the user asks for a simple one-way or round trip, generate a plan with one trip in the 'trips' array.
- If the user asks for a multi-day trip or a more complex plan, you can generate an itinerary with multiple trips in the 'trips' array.
- Always provide a creative 'title' and an inspiring 'description' for the plan.
- For any missing details (like seats or date), make a sensible default guess (e.g., 2 seats if they say "couple" or "for me and my friend", otherwise 1 seat; today's date if not specified).`;
    
    const generationParams = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            tools: [{ functionDeclarations: [createTripPlanFunctionDeclaration] }],
        },
    };

    const response = await generateWithRetry(ai, generationParams);

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0 && functionCalls[0].name === 'createTripPlan') {
      const tripPlanArgs = functionCalls[0].args;
      res.status(200).json(tripPlanArgs);
    } else {
      console.error('AI did not return a valid function call.', response.text);
      res.status(500).json({ error: 'AI failed to generate a structured trip plan. The model responded with: ' + (response.text || 'No text response.') });
    }

  } catch (error) {
    console.error('Error in plan-trip API after retries:', error);
    let errorMessage = 'Failed to generate trip plan from AI after multiple attempts.';
    if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('connect')) {
            errorMessage = 'Could not connect to the AI service. This might be a network or firewall issue in the execution environment.';
        } else {
            errorMessage = `AI Error: ${error.message}`;
        }
    }
    res.status(500).json({ error: errorMessage });
  }
}