import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Security: only allow alphanumeric, underscore, dash, and dot
  if (!/^[\w\-\.]+$/.test(filename)) {
    return new NextResponse("Invalid filename", { status: 400 });
  }

  const filePath = join(process.cwd(), "temp", "audio", filename);

  if (!existsSync(filePath)) {
    return new NextResponse("Audio not found", { status: 404 });
  }

  try {
    const audioBuffer = await readFile(filePath);

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[Audio Route] Error reading file:", error);
    return new NextResponse("Error reading audio", { status: 500 });
  }
}
