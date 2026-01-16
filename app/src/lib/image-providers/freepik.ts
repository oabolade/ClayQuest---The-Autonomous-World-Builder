/**
 * Freepik Mystic Image Provider
 *
 * Uses Freepik's Mystic API for high-quality image generation.
 * Supports text-to-image and image-to-image with structure reference.
 */

import {
  ImageProvider,
  ImageGenerationOptions,
  ImageGenerationResult,
} from "./types";

const API_BASE = "https://api.freepik.com/v1/ai/mystic";

interface MysticCreateResponse {
  data: {
    task_id: string;
    status: string;
    generated: string[];
  };
}

interface MysticStatusResponse {
  data: {
    task_id: string;
    status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
    generated: string[];
    has_nsfw?: boolean[];
  };
}

export class FreepikProvider implements ImageProvider {
  name = "freepik" as const;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.FREEPIK_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== "your_freepik_api_key_here";
  }

  async generateImage(
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResult> {
    if (!this.isAvailable()) {
      throw new Error("Freepik API key not configured");
    }

    const startTime = Date.now();

    // Create the generation task
    const taskId = await this.createTask(options);

    // Poll for completion
    const imageUrl = await this.waitForCompletion(taskId);

    return {
      url: imageUrl,
      provider: this.name,
      duration: Date.now() - startTime,
    };
  }

  private async createTask(options: ImageGenerationOptions): Promise<string> {
    const aspectRatioMap: Record<string, string> = {
      "4:3": "classic_4_3",
      "16:9": "widescreen_16_9",
      "1:1": "square_1_1",
      "3:4": "traditional_3_4",
    };

    const body: Record<string, unknown> = {
      prompt: options.prompt,
      resolution: "2k",
      aspect_ratio: aspectRatioMap[options.aspectRatio || "4:3"],
      model: "flexible",
      filter_nsfw: true,
    };

    // Add structure reference if provided
    if (options.referenceImage) {
      body.structure = {
        image_base64: options.referenceImage.replace(
          /^data:image\/\w+;base64,/,
          ""
        ),
        strength: options.referenceStrength ?? 70,
      };
    }

    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": this.apiKey!,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Freepik API error: ${response.status} - ${errorText}`);
    }

    const data: MysticCreateResponse = await response.json();
    return data.data.task_id;
  }

  private async waitForCompletion(
    taskId: string,
    maxAttempts = 60,
    intervalMs = 2000
  ): Promise<string> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await fetch(`${API_BASE}/${taskId}`, {
        method: "GET",
        headers: {
          "x-freepik-api-key": this.apiKey!,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Freepik status error: ${response.status} - ${errorText}`
        );
      }

      const data: MysticStatusResponse = await response.json();

      if (data.data.status === "COMPLETED") {
        if (data.data.generated && data.data.generated.length > 0) {
          return data.data.generated[0];
        }
        throw new Error("Freepik: No image generated");
      }

      if (data.data.status === "FAILED") {
        throw new Error("Freepik: Image generation failed");
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error("Freepik: Timeout waiting for image generation");
  }
}
