import { GoogleGenAI } from "@google/genai";

/**
 * Initializes the Gemini API client.
 * @param {string} apiKey
 * @returns {GoogleGenAI | null}
 */
export function createGeminiClient(apiKey) {
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
    return null;
  }
}

/**
 * Streams content generation from the Gemini API.
 * @param {GoogleGenAI} client - The GoogleGenAI instance.
 * @param {object} params
 * @param {string} params.model - The model to use (e.g. gemini-2.5-flash)
 * @param {Array} params.contents - The conversation history contents.
 * @param {string} [params.systemInstruction] - Optional system prompt instructions.
 * @returns {Promise<AsyncGenerator>}
 */
export async function streamContent(client, { model, contents, systemInstruction }) {
  if (!client) {
    throw new Error("Gemini client is not initialized. Check your settings.");
  }

  const config = {};
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  return client.models.generateContentStream({
    model: model || "gemini-2.5-flash",
    contents,
    config
  });
}
