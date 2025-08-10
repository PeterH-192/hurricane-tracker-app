import { GoogleGenAI, Type } from "@google/genai";
import { WeatherModel } from '../types';

const schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "A unique ID for the model, e.g., 'gfs'." },
      name: { type: Type.STRING, description: "The full name of the model, e.g., 'GFS Model'." },
      storms: {
        type: Type.ARRAY,
        description: "A list of storms predicted by this model.",
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "A unique ID for the storm, e.g., 'AL012024-GFS'." },
            name: { type: Type.STRING, description: "The name of the storm." },
            type: { type: Type.STRING, description: "The type of the storm.", enum: ['Hurricane', 'Tropical Storm', 'Invest'] },
            category: { type: Type.INTEGER, description: "Saffir-Simpson category (1-5 for hurricanes, 0 for others)." },
            windSpeed: { type: Type.NUMBER, description: "Maximum sustained wind speed in mph." },
            pressure: { type: Type.NUMBER, description: "Minimum central pressure in millibars (mb)." },
            location: {
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER, description: "Current latitude. Should be within the North Atlantic basin (e.g., 5 to 40)." },
                lon: { type: Type.NUMBER, description: "Current longitude. Should be within the North Atlantic basin (e.g., -100 to -20)." },
              },
              required: ['lat', 'lon']
            },
            summary: { type: Type.STRING, description: "A brief summary of the storm from this model's perspective." },
            forecast: {
              type: Type.ARRAY,
              description: "A 5-day forecast track.",
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: "Forecast day, e.g., 'Day 1'." },
                  lat: { type: Type.NUMBER, description: "Forecast latitude." },
                  lon: { type: Type.NUMBER, description: "Forecast longitude." },
                  windSpeed: { type: Type.NUMBER, description: "Forecast wind speed in mph." },
                  pressure: { type: Type.NUMBER, description: "Forecast pressure in mb." },
                  category: { type: Type.INTEGER, description: "Forecast category." },
                },
                required: ['day', 'lat', 'lon', 'windSpeed', 'pressure', 'category']
              },
            },
          },
          required: ['id', 'name', 'type', 'category', 'windSpeed', 'pressure', 'location', 'summary', 'forecast']
        },
      },
    },
    required: ['id', 'name', 'storms']
  },
};

export const getWeatherData = async (): Promise<WeatherModel[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set. Please configure the environment variables.");
  }
  
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

  const prompt = `
    Generate a realistic, up-to-date list of active hurricanes, tropical storms, and invests in the North Atlantic basin for today.
    Provide data from three major weather models: GFS, ECMWF, and UKMET.
    Each model should have its own list of storms. The models should show slight variations in storm location, intensity, and forecast track to be realistic.
    If there are no active storms, return an empty array.
    Ensure the latitude and longitude are plausible for the North Atlantic basin.
    The response MUST be a JSON object that strictly adheres to the provided schema. Do not add any extra text or explanations.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText);
    
    if (Array.isArray(data)) {
        return data as WeatherModel[];
    } else {
        console.error("API response is not in the expected array format:", data);
        return [];
    }

  } catch (error) {
    console.error("Error fetching or parsing weather data from AI:", error);
    throw new Error("Failed to generate live weather data. The AI model may be temporarily unavailable or data is malformed.");
  }
};