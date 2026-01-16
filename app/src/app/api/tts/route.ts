import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb"; // Default: George

// Generate a hash for caching based on text content
function getTextHash(text: string): string {
  return createHash("md5").update(text).digest("hex").slice(0, 12);
}

export async function POST(request: NextRequest) {
  try {
    const { text, pageIndex } = await request.json();

    console.log("[TTS] Request received, text length:", text?.length, "page:", pageIndex);
    console.log("[TTS] Using voice ID:", VOICE_ID);

    if (!text) {
      console.log("[TTS] No text provided");
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === "your_elevenlabs_api_key_here") {
      console.log("[TTS] No API key, falling back to Web Speech");
      return NextResponse.json({ useWebSpeech: true });
    }

    // Ensure temp/audio directory exists
    const audioDir = join(process.cwd(), "temp", "audio");
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true });
    }

    // Check if we already have this audio cached (based on text hash)
    const textHash = getTextHash(text);
    const filename = `audio_${textHash}_p${pageIndex ?? 0}.mp3`;
    const localPath = join(audioDir, filename);
    const audioUrl = `/temp/audio/${filename}`;

    if (existsSync(localPath)) {
      console.log("[TTS] Using cached audio:", localPath);
      return NextResponse.json({ audioUrl });
    }

    console.log("[TTS] Calling ElevenLabs API...");

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    console.log("[TTS] ElevenLabs response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[TTS] ElevenLabs error:", errorData);
      return NextResponse.json({ useWebSpeech: true });
    }

    const audioBuffer = await response.arrayBuffer();
    const sizeKB = (audioBuffer.byteLength / 1024).toFixed(1);
    console.log("[TTS] Audio received, size:", sizeKB, "KB");

    // Save audio to temp/audio folder
    try {
      await writeFile(localPath, Buffer.from(audioBuffer));
      console.log("[TTS] Audio saved to:", localPath);
    } catch (saveError) {
      console.error("[TTS] Failed to save audio:", saveError);
      // Still return the audio even if save fails
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": audioBuffer.byteLength.toString(),
        },
      });
    }

    // Return the local URL path
    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error("[TTS] Error:", error);
    return NextResponse.json({ useWebSpeech: true });
  }
}
