import { GoogleGenAI, Modality } from "@google/genai";

// FIX: Per coding guidelines, API key must be read from process.env.API_KEY.
// The previous use of import.meta.env.VITE_API_KEY was incorrect and caused a TypeScript error.
const apiKey = process.env.API_KEY;

if (!apiKey) {
    throw new Error("API_KEY environment variable not set. Please ensure it is configured.");
}

const ai = new GoogleGenAI({ apiKey });

const handleGeminiError = (error: unknown): Error => {
    console.error("Error calling Gemini API:", error);

    let message = "An unknown error occurred while communicating with the Gemini API.";

    if (typeof error === 'object' && error !== null) {
      const errorAny = error as any;
      if (errorAny.message && typeof errorAny.message === 'string') {
        message = errorAny.message;
      } else if (errorAny.error?.message && typeof errorAny.error.message === 'string') {
        message = errorAny.error.message;
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    const lowerCaseMessage = message.toLowerCase();
    if (lowerCaseMessage.includes("region not supported") || lowerCaseMessage.includes("permission denied")) {
        return new Error("We're sorry, but AI features are not available in your region.");
    }
    
    if (lowerCaseMessage.includes("api key")) {
        return new Error("There seems to be an issue with the API key configuration.");
    }
    
    return new Error(message);
};

export const editImageWithAI = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    const firstCandidate = response.candidates?.[0];
    if (firstCandidate?.finishReason && firstCandidate.finishReason !== 'STOP') {
        throw new Error(`Image generation failed due to: ${firstCandidate.finishReason}`);
    }

    throw new Error("No image data found in the AI response.");
  } catch (error: unknown) {
    throw handleGeminiError(error);
  }
};

export const removeBackgroundAI = async (
    base64ImageData: string,
    mimeType: string,
  ): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64ImageData,
                mimeType: mimeType,
              },
            },
            {
              text: "Remove the background of the image. The output should be a PNG with a transparent background, preserving only the main subject.",
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });
  
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
      
      const firstCandidate = response.candidates?.[0];
      if (firstCandidate?.finishReason && firstCandidate.finishReason !== 'STOP') {
          throw new Error(`Background removal failed due to: ${firstCandidate.finishReason}`);
      }
  
      throw new Error("No image data found in the AI response for background removal.");
    } catch (error: unknown) {
      throw handleGeminiError(error);
    }
  };