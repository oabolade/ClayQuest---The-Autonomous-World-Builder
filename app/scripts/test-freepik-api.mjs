/**
 * Freepik API Test Script
 *
 * Tests the Freepik Mystic API for image generation:
 * 1. Read reference image (test-clay.jpg)
 * 2. Generate a comic-style image based on the clay figure
 * 3. Poll for completion and save the result
 *
 * Usage: node scripts/test-freepik-api.mjs
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables manually from .env.local
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const FREEPIK_API_KEY = envVars.FREEPIK_API_KEY;
const API_BASE = "https://api.freepik.com/v1/ai/mystic";

async function createImageTask(prompt, structureImageBase64) {
  console.log("Creating image generation task...");
  console.log(`Prompt: ${prompt.slice(0, 100)}...`);

  const body = {
    prompt,
    resolution: "2k",
    aspect_ratio: "classic_4_3",
    model: "flexible", // Good for stylized/creative outputs
    filter_nsfw: true,
  };

  // If we have a structure reference image, add it
  if (structureImageBase64) {
    body.structure = {
      image_base64: structureImageBase64,
      strength: 70,
    };
  }

  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-freepik-api-key": FREEPIK_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create task: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`Task created: ${data.data.task_id}`);
  console.log(`Initial status: ${data.data.status}`);

  return data.data.task_id;
}

async function getTaskStatus(taskId) {
  const response = await fetch(`${API_BASE}/${taskId}`, {
    method: "GET",
    headers: {
      "x-freepik-api-key": FREEPIK_API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to get task status: ${response.status} - ${errorText}`
    );
  }

  return response.json();
}

async function waitForCompletion(taskId, maxAttempts = 60, intervalMs = 2000) {
  console.log("\nWaiting for generation to complete...");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const status = await getTaskStatus(taskId);
    console.log(`  Attempt ${attempt}/${maxAttempts}: ${status.data.status}`);

    if (status.data.status === "COMPLETED") {
      console.log("Generation completed!");
      return status.data.generated;
    }

    if (status.data.status === "FAILED") {
      throw new Error("Image generation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Timeout waiting for image generation");
}

async function downloadImage(url, outputPath) {
  console.log(`\nDownloading image from: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`Image saved to: ${outputPath}`);
}

async function main() {
  console.log("=== Freepik API Test ===\n");

  // Check API key
  if (!FREEPIK_API_KEY) {
    console.error("Error: FREEPIK_API_KEY not found in .env.local");
    process.exit(1);
  }
  console.log(`API Key: ${FREEPIK_API_KEY.slice(0, 8)}...`);

  // Read reference image
  const refImagePath = path.join(__dirname, "../public/test-clay.jpg");
  if (!fs.existsSync(refImagePath)) {
    console.error(`Error: Reference image not found at ${refImagePath}`);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(refImagePath);
  const imageBase64 = imageBuffer.toString("base64");
  console.log(`Reference image loaded: ${refImagePath}`);
  console.log(`Image size: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

  // Create output directory
  const outputDir = path.join(__dirname, "../output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create prompt for comic-style image based on the clay figure
  const prompt = `A cute cartoon character that looks like a small cube robot with a purple circular face,
yellow body, and blue side pieces. Children's book illustration style, comic art,
colorful, whimsical, friendly, soft pastel colors, magical forest background,
the character is smiling and waving hello. High quality digital art.`;

  try {
    // Test 1: Generate with just the prompt (text-to-image)
    console.log("\n--- Test 1: Text-to-Image Generation ---");
    const taskId1 = await createImageTask(prompt);
    const urls1 = await waitForCompletion(taskId1);

    if (urls1.length > 0) {
      const outputPath1 = path.join(
        outputDir,
        `freepik-text2img-${Date.now()}.jpg`
      );
      await downloadImage(urls1[0], outputPath1);
    }

    // Test 2: Generate with structure reference (image-to-image)
    console.log("\n--- Test 2: Image-to-Image with Structure Reference ---");
    const prompt2 = `Transform into a comic book style illustration. A cute cartoon robot character,
children's book art style, vibrant colors, whimsical, friendly expression,
magical adventure scene, soft lighting. High quality digital art.`;

    const taskId2 = await createImageTask(prompt2, imageBase64);
    const urls2 = await waitForCompletion(taskId2);

    if (urls2.length > 0) {
      const outputPath2 = path.join(
        outputDir,
        `freepik-img2img-${Date.now()}.jpg`
      );
      await downloadImage(urls2[0], outputPath2);
    }

    console.log("\n=== Test Complete ===");
    console.log(`Check the output directory: ${outputDir}`);
  } catch (error) {
    console.error("\nError:", error);
    process.exit(1);
  }
}

main();
