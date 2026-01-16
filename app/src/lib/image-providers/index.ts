/**
 * Image Provider Factory
 *
 * Manages image generation providers with automatic fallback support.
 *
 * Configuration via environment variables:
 * - IMAGE_PROVIDER: Primary provider ("freepik" | "gemini" | "placeholder")
 * - IMAGE_PROVIDER_FALLBACK: Fallback provider (optional)
 */

import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import {
  ImageProvider,
  ImageProviderType,
  ImageGenerationOptions,
  ImageGenerationResult,
} from "./types";
import { FreepikProvider } from "./freepik";
import { GeminiProvider } from "./gemini";
import { PlaceholderProvider } from "./placeholder";

export * from "./types";

// Counter for unique filenames
let imageCounter = 0;

// Singleton instances
const providers: Record<ImageProviderType, ImageProvider> = {
  freepik: new FreepikProvider(),
  gemini: new GeminiProvider(),
  placeholder: new PlaceholderProvider(),
};

/**
 * Get the configured image provider type from environment
 */
export function getConfiguredProvider(): ImageProviderType {
  const configured = process.env.IMAGE_PROVIDER as ImageProviderType;
  if (configured && providers[configured]) {
    return configured;
  }
  // Default to freepik
  return "freepik";
}

/**
 * Get the configured fallback provider type from environment
 */
export function getFallbackProvider(): ImageProviderType | undefined {
  const fallback = process.env.IMAGE_PROVIDER_FALLBACK as ImageProviderType;
  if (fallback && providers[fallback]) {
    return fallback;
  }
  return undefined;
}

/**
 * Get a specific provider instance
 */
export function getProvider(type: ImageProviderType): ImageProvider {
  return providers[type];
}

/**
 * Get the active image provider based on configuration
 */
export function getActiveProvider(): ImageProvider {
  const configuredType = getConfiguredProvider();
  const provider = providers[configuredType];

  if (provider.isAvailable()) {
    return provider;
  }

  // Try fallback
  const fallbackType = getFallbackProvider();
  if (fallbackType) {
    const fallback = providers[fallbackType];
    if (fallback.isAvailable()) {
      console.warn(
        `Image provider ${configuredType} not available, using fallback: ${fallbackType}`
      );
      return fallback;
    }
  }

  // Last resort: placeholder
  console.warn(
    `Image provider ${configuredType} not available, using placeholder`
  );
  return providers.placeholder;
}

/**
 * Download image from URL or save base64 to local temp directory
 */
async function saveImageToLocal(
  imageUrl: string,
  provider: ImageProviderType
): Promise<string> {
  const tempDir = join(process.cwd(), "temp", "images");

  // Ensure temp/images directory exists
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }

  imageCounter++;
  const timestamp = Date.now();
  const filename = `${provider}_${timestamp}_${imageCounter}.png`;
  const localPath = join(tempDir, filename);

  try {
    let imageBuffer: Buffer;

    if (imageUrl.startsWith("data:image")) {
      // Handle base64 data URL (from Gemini)
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(base64Data, "base64");
    } else if (imageUrl.startsWith("http")) {
      // Download from remote URL (from Freepik)
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      // Already a local path or placeholder URL, return as-is
      return imageUrl;
    }

    await writeFile(localPath, imageBuffer);
    const sizeKB = (imageBuffer.length / 1024).toFixed(1);
    console.log(`[Image] Saved to ${localPath} (${sizeKB} KB)`);

    // Return URL path for serving via Next.js
    return `/temp/images/${filename}`;
  } catch (error) {
    console.error("[Image] Failed to save locally:", error);
    // Return original URL as fallback
    return imageUrl;
  }
}

/**
 * Generate an image using the configured provider with automatic fallback
 * Images are downloaded and saved to temp/images/ for faster loading
 */
export async function generateImage(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const primaryType = getConfiguredProvider();
  const primary = providers[primaryType];

  // Try primary provider
  if (primary.isAvailable()) {
    try {
      const result = await primary.generateImage(options);
      console.log(
        `Image generated with ${result.provider} in ${result.duration}ms`
      );

      // Save to local temp directory
      const localUrl = await saveImageToLocal(result.url, result.provider);

      return {
        ...result,
        url: localUrl,
      };
    } catch (error) {
      console.error(`Primary provider ${primaryType} failed:`, error);
    }
  }

  // Try fallback provider
  const fallbackType = getFallbackProvider();
  if (fallbackType) {
    const fallback = providers[fallbackType];
    if (fallback.isAvailable()) {
      try {
        console.warn(`Falling back to ${fallbackType}`);
        const result = await fallback.generateImage(options);
        console.log(
          `Image generated with fallback ${result.provider} in ${result.duration}ms`
        );

        // Save to local temp directory
        const localUrl = await saveImageToLocal(result.url, result.provider);

        return {
          ...result,
          url: localUrl,
        };
      } catch (error) {
        console.error(`Fallback provider ${fallbackType} failed:`, error);
      }
    }
  }

  // Last resort: placeholder (don't save placeholder images)
  console.warn("All providers failed, using placeholder");
  return providers.placeholder.generateImage(options);
}

/**
 * Check which providers are currently available
 */
export function getAvailableProviders(): ImageProviderType[] {
  return (Object.keys(providers) as ImageProviderType[]).filter((type) =>
    providers[type].isAvailable()
  );
}

/**
 * Get provider status for debugging
 */
export function getProviderStatus(): Record<
  ImageProviderType,
  { available: boolean }
> {
  return {
    freepik: { available: providers.freepik.isAvailable() },
    gemini: { available: providers.gemini.isAvailable() },
    placeholder: { available: providers.placeholder.isAvailable() },
  };
}
