import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const STORAGE_PATH =
  process.env.SNAPSHOT_STORAGE_PATH || "./storage/snapshots";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Prevent path traversal
  const safeName = path.basename(filename);
  const filePath = path.join(path.resolve(STORAGE_PATH), safeName);

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Imagem nao encontrada" },
      { status: 404 }
    );
  }
}
