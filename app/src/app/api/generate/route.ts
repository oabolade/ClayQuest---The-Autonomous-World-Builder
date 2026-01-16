import { NextRequest, NextResponse } from "next/server";
import { generateStory } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const story = await generateStory(image);

    return NextResponse.json({ story });
  } catch (error) {
    console.error("Story generation error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate story";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
