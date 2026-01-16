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

  const filePath = join(process.cwd(), "temp", "images", filename);

  if (!existsSync(filePath)) {
    return new NextResponse("Image not found", { status: 404 });
  }

  try {
    const imageBuffer = await readFile(filePath);

    // Determine content type from extension
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : "application/octet-stream";

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": imageBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[Image Route] Error reading file:", error);
    return new NextResponse("Error reading image", { status: 500 });
  }
}
