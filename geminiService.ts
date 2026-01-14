
import { GoogleGenAI, Type } from "@google/genai";
import { Sentiment, SentimentResult } from "./types";

/**
 * Creates a fresh instance of the AI client.
 * This ensures the latest API key from the environment is utilized.
 */
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeSentiment = async (text: string): Promise<SentimentResult> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following text and extract sentiment details: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: {
            type: Type.STRING,
            enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'],
            description: "Classification of text sentiment."
          },
          confidence: {
            type: Type.NUMBER,
            description: "Score from 0 to 1 indicating model certainty."
          },
          keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Specific terms indicating the sentiment."
          },
          explanation: {
            type: Type.STRING,
            description: "Reasoning for the classification."
          }
        },
        required: ["sentiment", "confidence", "keywords", "explanation"]
      }
    }
  });

  const rawJson = JSON.parse(response.text || '{}');
  return {
    id: Math.random().toString(36).substring(7),
    text,
    sentiment: (rawJson.sentiment || 'NEUTRAL') as Sentiment,
    confidence: rawJson.confidence || 0,
    keywords: rawJson.keywords || [],
    explanation: rawJson.explanation || "No explanation provided."
  };
};

export const batchAnalyzeSentiment = async (texts: string[]): Promise<SentimentResult[]> => {
  const ai = getAIClient();
  // Filter out empty lines to save tokens and avoid empty analysis
  const filteredTexts = texts.filter(t => t.trim().length > 0);
  
  if (filteredTexts.length === 0) return [];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Perform sentiment analysis on the following ${filteredTexts.length} distinct entries. Return an array of analysis objects corresponding to each entry.
    
    Inputs:
    ${filteredTexts.map((t, i) => `Entry ${i + 1}: ${t}`).join('\n')}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sentiment: {
              type: Type.STRING,
              enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'],
              description: "The identified sentiment vector."
            },
            confidence: {
              type: Type.NUMBER,
              description: "Fidelity score (0-1)."
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key linguistic drivers."
            },
            explanation: {
              type: Type.STRING,
              description: "Deep reasoning for classification."
            }
          },
          required: ["sentiment", "confidence", "keywords", "explanation"]
        }
      }
    }
  });

  try {
    const rawResults = JSON.parse(response.text || '[]');
    return rawResults.map((res: any, index: number) => ({
      id: Math.random().toString(36).substring(7),
      text: filteredTexts[index] || "Unknown source",
      sentiment: (res.sentiment || 'NEUTRAL') as Sentiment,
      confidence: res.confidence || 0,
      keywords: res.keywords || [],
      explanation: res.explanation || "No explanation provided."
    }));
  } catch (e) {
    console.error("Failed to parse batch JSON response", e);
    throw new Error("Invalid response format from AI. Please try again with a smaller batch.");
  }
};
