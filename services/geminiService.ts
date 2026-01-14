
import { GoogleGenAI } from "@google/genai";
import { ResearchResult, Trend, GroundingSource } from "../types";

const RESEARCH_MODEL = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

export const researchCurrentTrends = async (): Promise<ResearchResult> => {
  // Always use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Identify exactly 3 distinct visual marketing trends or aesthetics that have become popular in the global creative industry within the last 30 days (e.g., specific color palettes, photography styles, or graphic design movements). 
  For each trend, provide:
  1. A short catchy TITLE.
  2. A "STORY": Why it is popular right now and its cultural impact (2-3 sentences).
  3. A "PROMPT": A highly descriptive visual prompt that describes how a product would be staged in this style.
  
  Format the response clearly with labels TREND 1, TREND 2, TREND 3.`;

  const response = await ai.models.generateContent({
    model: RESEARCH_MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "";
  const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.filter(chunk => chunk.web)
    ?.map(chunk => ({
      title: chunk.web?.title || 'Source',
      uri: chunk.web?.uri || ''
    })) || [];

  // Basic parsing of the text into 3 trends
  const trendBlocks = text.split(/TREND \d:?/i).filter(b => b.trim().length > 50).slice(0, 3);
  
  const trends: Trend[] = trendBlocks.map((block, index) => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const title = lines[0].replace(/Title:?/i, '').trim();
    const story = lines.find(l => l.toLowerCase().includes('story'))?.replace(/Story:?/i, '').trim() || "Explanation of popularity...";
    const visualPrompt = lines.find(l => l.toLowerCase().includes('prompt'))?.replace(/Prompt:?/i, '').trim() || "Visual description...";

    return {
      id: `trend-${index}`,
      title,
      story,
      visualPrompt,
      loading: false
    };
  });

  return { trends, sources };
};

export const generateTrendVisualization = async (
  base64Image: string,
  visualPrompt: string
): Promise<string> => {
  // Always use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Apply this trending aesthetic to the product in the image: ${visualPrompt}. 
  CRITICAL: The product itself (labels, logo, colors) must remain 100% consistent and untouched. Change only the environment, lighting, and staging style to match the trend.`;

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data returned from Gemini");
};
