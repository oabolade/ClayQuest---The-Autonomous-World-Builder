import Anthropic from "@anthropic-ai/sdk";
import { Story } from "@/types";

const anthropic = new Anthropic();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface StoryOutline {
  title: string;
  characterDescription: string;
  pages: {
    text: string;
    imagePrompt: string;
  }[];
}

export async function analyzeImageAndCreateStory(
  imageBase64: string
): Promise<StoryOutline> {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64Data,
            },
          },
          {
            type: "text",
            text: `You are a children's storyteller. Look at this clay creation made by a child and create a magical, age-appropriate story (for ages 4-8) featuring this character.

Create a story with EXACTLY 4 pages. Each page should have:
1. A short paragraph of text (2-3 sentences, simple vocabulary)
2. A description for an illustration

The story should:
- Have a clear beginning, middle, and end
- Be positive and uplifting
- Feature the clay creation as the main character
- Include a simple adventure or lesson
- Use the character's actual appearance (colors, shape, features you can see)

Respond in JSON format:
{
  "title": "Story Title",
  "characterDescription": "Detailed description of the clay character's appearance for consistent image generation (colors, shape, features, size)",
  "pages": [
    {
      "text": "Story text for page 1",
      "imagePrompt": "Detailed scene description for page 1"
    },
    ... (4 pages total)
  ]
}

IMPORTANT for imagePrompt:
- Describe the SCENE and ACTION, not the character (character will be added separately)
- Focus on: setting, mood, lighting, what's happening
- Style: children's book illustration, colorful, whimsical, friendly`,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse story JSON");
  }

  const storyData = JSON.parse(jsonMatch[0]);

  return {
    title: storyData.title,
    characterDescription: storyData.characterDescription || "a cute clay character",
    pages: storyData.pages.map(
      (p: { text: string; imagePrompt: string }) => ({
        text: p.text,
        imagePrompt: p.imagePrompt,
      })
    ),
  };
}

export async function generateImageWithImagen(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn("No Gemini API key, using placeholder");
    return generatePlaceholderImage(prompt);
  }

  try {
    const response = await fetch(
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

    if (!response.ok) {
      const error = await response.json();
      console.error("Imagen API error:", error);
      return generatePlaceholderImage(prompt);
    }

    const data = await response.json();

    if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
      const base64 = data.predictions[0].bytesBase64Encoded;
      return `data:image/png;base64,${base64}`;
    }

    console.warn("No image in Imagen response, using placeholder");
    return generatePlaceholderImage(prompt);
  } catch (error) {
    console.error("Imagen generation error:", error);
    return generatePlaceholderImage(prompt);
  }
}

function generatePlaceholderImage(prompt: string): string {
  const seed = Math.abs(hashCode(prompt));
  return `https://picsum.photos/seed/${seed}/800/600`;
}

export async function generateStory(imageBase64: string): Promise<Story> {
  // Step 1: Analyze image and create story outline
  console.log("Step 1: Analyzing image and creating story...");
  const outline = await analyzeImageAndCreateStory(imageBase64);
  console.log("Story outline created:", outline.title);

  // Step 2: Generate images for each page (in parallel for speed)
  console.log("Step 2: Generating images with Imagen 4.0...");
  const imagePromises = outline.pages.map((page, index) => {
    // Combine character description with scene for consistent imagery
    const fullPrompt = `Children's book illustration style, colorful and whimsical: ${outline.characterDescription} - ${page.imagePrompt}. Friendly, magical atmosphere, soft lighting, suitable for ages 4-8.`;
    console.log(`  Generating image ${index + 1}...`);
    return generateImageWithImagen(fullPrompt);
  });

  const imageUrls = await Promise.all(imagePromises);
  console.log("All images generated!");

  // Step 3: Combine into story pages
  const pages = outline.pages.map((page, index) => ({
    id: index + 1,
    text: page.text,
    imageUrl: imageUrls[index],
    audioUrl: "", // Will use Web Speech API or ElevenLabs on client
  }));

  return {
    id: crypto.randomUUID(),
    title: outline.title,
    pages,
    createdAt: new Date(),
  };
}

// Simple hash function for generating consistent seeds
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}
