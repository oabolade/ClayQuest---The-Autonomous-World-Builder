import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb"; // Default: George

// Counter for unique filenames
let audioCounter = 0;

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    console.log("[TTS] Request received, text length:", text?.length);
    console.log("[TTS] Using voice ID:", VOICE_ID);

    if (!text) {
      console.log("[TTS] No text provided");
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === "your_elevenlabs_api_key_here") {
      console.log("[TTS] No API key, falling back to Web Speech");
      return NextResponse.json({ useWebSpeech: true });
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
    console.log("[TTS] Audio received, size:", audioBuffer.byteLength, "bytes");

    // Save audio to temp folder for debugging
    try {
      audioCounter++;
      const filename = `audio_${Date.now()}_${audioCounter}.mp3`;
      const tempPath = join(process.cwd(), "temp", filename);
      await writeFile(tempPath, Buffer.from(audioBuffer));
      console.log("[TTS] Audio saved to:", tempPath);
    } catch (saveError) {
      console.error("[TTS] Failed to save audio:", saveError);
    }

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("[TTS] Error:", error);
    return NextResponse.json({ useWebSpeech: true });
  }
}
