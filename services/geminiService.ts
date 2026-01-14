
import { GoogleGenAI } from "@google/genai";
import { ResearchResult, Trend, GroundingSource } from "../types";

const RESEARCH_MODEL = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

export const researchCurrentTrends = async (): Promise<ResearchResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Research and identify exactly 3 distinct visual marketing trends or aesthetics that have surged in popularity in the global creative industry (social media, design, advertising) within the last 30 days.

For each trend, you MUST follow this EXACT format:

TREND [Number]: [Catchy Short Title]
STORY: [2-3 sentences explaining why it's popular and its cultural driver]
PROMPT: [A highly detailed 1-sentence visual description for generating an image of a product in this style]

Ensure you provide exactly 3 trends. Use Google Search to find current data from late 2025/early 2026.`;

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

  // Split by Trend headers
  const trendBlocks = text.split(/TREND \d:?/i).filter(block => block.toLowerCase().includes('story') && block.toLowerCase().includes('prompt'));
  
  const trends: Trend[] = trendBlocks.slice(0, 3).map((block, index) => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // First non-empty line after the split is usually the Title
    const title = lines[0].replace(/^[ \t*#-]+/, '').trim();
    
    // Find Story and Prompt lines, handling potential markdown bolding (**Story:**)
    const storyLine = lines.find(l => /^(?:\*\*|\*|#|\s)*story:?/i.test(l));
    const promptLine = lines.find(l => /^(?:\*\*|\*|#|\s)*prompt:?/i.test(l));

    const story = storyLine 
      ? storyLine.replace(/^(?:\*\*|\*|#|\s)*story:?\s*/i, '').trim() 
      : "The story for this trend is currently evolving in the market.";
      
    const visualPrompt = promptLine 
      ? promptLine.replace(/^(?:\*\*|\*|#|\s)*prompt:?\s*/i, '').trim() 
      : "A professional studio shot in a modern aesthetic.";

    return {
      id: `trend-${index}`,
      title: title.length > 60 ? title.substring(0, 60) + "..." : title,
      story,
      visualPrompt,
      loading: true
    };
  });

  return { trends, sources };
};

export const generateTrendVisualization = async (
  base64Image: string,
  visualPrompt: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Task: Re-visualize the product in the provided image using this trending aesthetic: ${visualPrompt}. 
  
  STRICT CONSTRAINTS:
  1. The product (its shape, labels, text, and original colors) MUST remain identical and clearly legible.
  2. Do NOT change the branding.
  3. Change the environment, lighting, background, and overall photography style to match the requested trend.`;

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
