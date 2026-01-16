/**
 * Gemini Imagen 4.0 Image Provider
 *
 * Uses Google's Imagen 4.0 API via Gemini for image generation.
 */

import {
  ImageProvider,
  ImageGenerationOptions,
  ImageGenerationResult,
} from "./types";

export class GeminiProvider implements ImageProvider {
  name = "gemini" as const;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== "your_gemini_api_key_here";
  }

  async generateImage(
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResult> {
    if (!this.isAvailable()) {
      throw new Error("Gemini API key not configured");
    }

    const startTime = Date.now();

    const aspectRatioMap: Record<string, string> = {
      "4:3": "4:3",
      "16:9": "16:9",
      "1:1": "1:1",
      "3:4": "3:4",
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: options.prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: aspectRatioMap[options.aspectRatio || "4:3"],
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
      const base64 = data.predictions[0].bytesBase64Encoded;
      return {
        url: `data:image/png;base64,${base64}`,
        provider: this.name,
        duration: Date.now() - startTime,
      };
    }

    throw new Error("Gemini: No image in response");
  }
}
