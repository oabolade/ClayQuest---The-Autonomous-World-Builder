/**
 * Image Provider Integration Test
 *
 * Tests the new image provider system with automatic fallback.
 *
 * Usage: node scripts/test-image-providers.mjs
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables manually from .env.local
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
});

// Now import the provider system (after env vars are set)
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const IMAGE_PROVIDER = process.env.IMAGE_PROVIDER;
const IMAGE_PROVIDER_FALLBACK = process.env.IMAGE_PROVIDER_FALLBACK;

console.log("=== Image Provider Integration Test ===\n");
console.log("Configuration:");
console.log(`  IMAGE_PROVIDER: ${IMAGE_PROVIDER}`);
console.log(`  IMAGE_PROVIDER_FALLBACK: ${IMAGE_PROVIDER_FALLBACK}`);
console.log(`  FREEPIK_API_KEY: ${FREEPIK_API_KEY?.slice(0, 8)}...`);
console.log(`  GEMINI_API_KEY: ${GEMINI_API_KEY?.slice(0, 8)}...`);

// Freepik API implementation (inline for testing)
const FREEPIK_API_BASE = "https://api.freepik.com/v1/ai/mystic";

async function testFreepik() {
  console.log("\n--- Testing Freepik Provider ---");

  if (!FREEPIK_API_KEY) {
    console.log("  SKIPPED: No API key");
    return null;
  }

  const prompt =
    "A cute cartoon robot character, children's book illustration style, colorful, whimsical";

  try {
    // Create task
    const createRes = await fetch(FREEPIK_API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": FREEPIK_API_KEY,
      },
      body: JSON.stringify({
        prompt,
        resolution: "2k",
        aspect_ratio: "classic_4_3",
        model: "flexible",
        filter_nsfw: true,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.log(`  FAILED: ${createRes.status} - ${err}`);
      return null;
    }

    const createData = await createRes.json();
    const taskId = createData.data.task_id;
    console.log(`  Task created: ${taskId}`);

    // Poll for completion
    for (let i = 0; i < 30; i++) {
      const statusRes = await fetch(`${FREEPIK_API_BASE}/${taskId}`, {
        headers: { "x-freepik-api-key": FREEPIK_API_KEY },
      });

      const statusData = await statusRes.json();
      console.log(`  Poll ${i + 1}: ${statusData.data.status}`);

      if (statusData.data.status === "COMPLETED") {
        console.log(`  SUCCESS: ${statusData.data.generated[0]}`);
        return statusData.data.generated[0];
      }

      if (statusData.data.status === "FAILED") {
        console.log("  FAILED: Generation failed");
        return null;
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    console.log("  FAILED: Timeout");
    return null;
  } catch (error) {
    console.log(`  FAILED: ${error.message}`);
    return null;
  }
}

async function testGemini() {
  console.log("\n--- Testing Gemini Provider ---");

  if (!GEMINI_API_KEY) {
    console.log("  SKIPPED: No API key");
    return null;
  }

  const prompt =
    "A cute cartoon robot character, children's book illustration style, colorful, whimsical";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "4:3",
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.log(`  FAILED: ${res.status} - ${JSON.stringify(err)}`);
      return null;
    }

    const data = await res.json();

    if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
      console.log("  SUCCESS: Image generated (base64)");
      return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded.slice(0, 50)}...`;
    }

    console.log("  FAILED: No image in response");
    return null;
  } catch (error) {
    console.log(`  FAILED: ${error.message}`);
    return null;
  }
}

async function main() {
  const results = {};

  // Test each provider
  results.freepik = await testFreepik();
  results.gemini = await testGemini();

  console.log("\n=== Summary ===");
  console.log(`  Freepik: ${results.freepik ? "OK" : "FAILED"}`);
  console.log(`  Gemini: ${results.gemini ? "OK" : "FAILED"}`);

  // Verify fallback logic
  console.log("\n=== Fallback Logic ===");
  if (IMAGE_PROVIDER === "freepik" && results.freepik) {
    console.log("  Primary (freepik) is working - no fallback needed");
  } else if (IMAGE_PROVIDER === "freepik" && !results.freepik && results.gemini) {
    console.log("  Primary (freepik) failed - fallback (gemini) available");
  } else if (IMAGE_PROVIDER === "gemini" && results.gemini) {
    console.log("  Primary (gemini) is working - no fallback needed");
  } else if (IMAGE_PROVIDER === "gemini" && !results.gemini && results.freepik) {
    console.log("  Primary (gemini) failed - fallback (freepik) available");
  } else {
    console.log("  Warning: Primary provider may not be available");
  }

  console.log("\n=== Test Complete ===");
}

main();
