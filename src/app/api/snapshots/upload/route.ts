import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const STORAGE_PATH =
  process.env.SNAPSHOT_STORAGE_PATH || "./storage/snapshots";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json(
      { error: "Nenhum arquivo enviado" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const hash = crypto.randomBytes(16).toString("hex");
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${hash}${ext}`;

  const storagePath = path.resolve(STORAGE_PATH);
  await mkdir(storagePath, { recursive: true });

  const filePath = path.join(storagePath, filename);
  await writeFile(filePath, buffer);

  return NextResponse.json({ path: `/api/snapshots/${filename}` });
}
