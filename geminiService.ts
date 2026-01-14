
import { GoogleGenAI, Type } from "@google/genai";
import { Sentiment, SentimentResult } from "./types";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Helper to handle rate limits (429) with simple exponential backoff.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('quota');
    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const analyzeSentiment = async (text: string): Promise<SentimentResult> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Sentiment analysis for: "${text}"`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Optimization: Disable thinking for simple tasks
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'] },
            confidence: { type: Type.NUMBER },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            explanation: { type: Type.STRING }
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
      explanation: rawJson.explanation || "Analyzed."
    };
  });
};

export const analyzeAudioSentiment = async (base64Audio: string, mimeType: string): Promise<SentimentResult> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          { text: "Analyze the sentiment of this audio. First, transcribe the spoken content accurately. Then, classify the sentiment and extract key drivers." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcription: { type: Type.STRING },
            sentiment: { type: Type.STRING, enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'] },
            confidence: { type: Type.NUMBER },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            explanation: { type: Type.STRING }
          },
          required: ["transcription", "sentiment", "confidence", "keywords", "explanation"]
        }
      }
    });

    const rawJson = JSON.parse(response.text || '{}');
    return {
      id: Math.random().toString(36).substring(7),
      text: rawJson.transcription || "Decrypted Audio Content",
      sentiment: (rawJson.sentiment || 'NEUTRAL') as Sentiment,
      confidence: rawJson.confidence || 0,
      keywords: rawJson.keywords || [],
      explanation: rawJson.explanation || "Voice intelligence resolved."
    };
  });
};

export const batchAnalyzeSentiment = async (texts: string[]): Promise<SentimentResult[]> => {
  const filteredTexts = texts.filter(t => t.trim().length > 0);
  if (filteredTexts.length === 0) return [];

  return callWithRetry(async () => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze sentiment for these ${filteredTexts.length} inputs. Return an array:
      ${filteredTexts.map((t, i) => `${i}: ${t}`).join('\n')}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sentiment: { type: Type.STRING, enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'] },
              confidence: { type: Type.NUMBER },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              explanation: { type: Type.STRING }
            },
            required: ["sentiment", "confidence", "keywords", "explanation"]
          }
        }
      }
    });

    const rawResults = JSON.parse(response.text || '[]');
    return rawResults.map((res: any, index: number) => ({
      id: Math.random().toString(36).substring(7),
      text: filteredTexts[index] || "Unknown",
      sentiment: (res.sentiment || 'NEUTRAL') as Sentiment,
      confidence: res.confidence || 0,
      keywords: res.keywords || [],
      explanation: res.explanation || "Batch analyzed."
    }));
  });
};
