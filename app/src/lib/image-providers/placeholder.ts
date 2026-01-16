/**
 * Placeholder Image Provider
 *
 * Fallback provider that returns placeholder images when no API is available.
 * Uses picsum.photos for random placeholder images.
 */

import {
  ImageProvider,
  ImageGenerationOptions,
  ImageGenerationResult,
} from "./types";

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export class PlaceholderProvider implements ImageProvider {
  name = "placeholder" as const;

  isAvailable(): boolean {
    return true; // Always available as fallback
  }

  async generateImage(
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResult> {
    const startTime = Date.now();

    // Generate a consistent seed based on the prompt
    const seed = hashCode(options.prompt);

    // Determine dimensions based on aspect ratio
    const dimensions: Record<string, { width: number; height: number }> = {
      "4:3": { width: 800, height: 600 },
      "16:9": { width: 960, height: 540 },
      "1:1": { width: 600, height: 600 },
      "3:4": { width: 600, height: 800 },
    };

    const { width, height } = dimensions[options.aspectRatio || "4:3"];

    return {
      url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
      provider: this.name,
      duration: Date.now() - startTime,
    };
  }
}
