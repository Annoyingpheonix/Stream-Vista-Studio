import { GoogleGenAI } from "@google/genai";
import { VeoConfig, ImageConfig } from "../types";

// Helper to ensure we get a fresh instance, potentially with a newly selected key
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateVeoVideo = async (prompt: string, config: VeoConfig) => {
  const ai = getAIClient();
  
  // Initial generation request
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: config.resolution,
      aspectRatio: config.aspectRatio
    }
  });

  // Polling loop
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10s as per guidelines
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  // Extract result
  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) {
    throw new Error("No video URI returned from Veo.");
  }

  // We must fetch the video blob manually to append the API key
  const fetchUrl = `${videoUri}&key=${process.env.API_KEY}`;
  const res = await fetch(fetchUrl);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

export const generateProImage = async (prompt: string, config: ImageConfig) => {
  const ai = getAIClient();

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: config.aspectRatio,
        imageSize: "2K" // Defaulting to high quality
      }
    }
  });

  // Extract image
  // The response structure for images in Gemini 3 series:
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No content generated");

  for (const part of parts) {
    if (part.inlineData) {
      const base64Str = part.inlineData.data;
      return `data:image/png;base64,${base64Str}`;
    }
  }
  
  throw new Error("No image data found in response");
};