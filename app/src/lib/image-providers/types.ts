/**
 * Image Generation Provider Types
 *
 * Abstraction layer for multiple image generation services.
 * Supports: Freepik Mystic, Gemini Imagen, and placeholder fallback.
 */

export type ImageProviderType = "freepik" | "gemini" | "placeholder";

export interface ImageGenerationOptions {
  prompt: string;
  aspectRatio?: "4:3" | "16:9" | "1:1" | "3:4";
  /** Reference image for style/structure transfer (base64) */
  referenceImage?: string;
  /** How closely to follow the reference (0-100) */
  referenceStrength?: number;
}

export interface ImageGenerationResult {
  url: string;
  provider: ImageProviderType;
  /** Generation time in ms */
  duration?: number;
}

export interface ImageProvider {
  name: ImageProviderType;
  isAvailable(): boolean;
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
}

export interface ImageProviderConfig {
  provider: ImageProviderType;
  /** Fallback provider if primary fails */
  fallback?: ImageProviderType;
}
