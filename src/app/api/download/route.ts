import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileKey = searchParams.get("file") || "mac";

  let filename = "Gestor_Negocio_Mac.dmg";
  let contentType = "application/x-apple-diskimage";

  if (fileKey === "mac" || fileKey.includes("dmg")) {
    filename = "Gestor_Negocio_Mac.dmg";
    contentType = "application/x-apple-diskimage";
  } else if (fileKey === "mac-zip" || fileKey.includes("Mac.zip")) {
    filename = "Gestor_Negocio_Mac.zip";
    contentType = "application/zip";
  } else if (fileKey === "windows" || fileKey === "exe" || fileKey.includes("exe")) {
    filename = "Instalador_Gestor_Negocio.exe";
    contentType = "application/vnd.microsoft.portable-executable";
  } else if (fileKey === "windows-zip") {
    filename = "Gestor_Negocio_Windows.zip";
    contentType = "application/zip";
  } else if (fileKey === "backup" || fileKey === "zip") {
    filename = "gestor-negocio.zip";
    contentType = "application/zip";
  }

  // Look in public folder first, then project root, then brain artifact dir
  const candidatePaths = [
    path.join(process.cwd(), "public", filename),
    path.join(process.cwd(), ".next", "standalone", "public", filename),
    path.join(process.cwd(), filename),
    path.join(
      "/Users/mrgarciag/.gemini/antigravity/brain/d82088b4-fed1-470a-8783-d6fac5666818",
      filename
    ),
  ];

  let resolvedPath = "";
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      resolvedPath = p;
      break;
    }
  }

  if (!resolvedPath) {
    return new NextResponse(`Archivo "${filename}" no encontrado en el servidor.`, {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const fileStat = fs.statSync(resolvedPath);
  const fileStream = fs.createReadStream(resolvedPath);

  // Convert Node ReadStream to Web ReadableStream
  const readable = new ReadableStream({
    start(controller) {
      fileStream.on("data", (chunk) => controller.enqueue(chunk));
      fileStream.on("end", () => controller.close());
      fileStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      fileStream.destroy();
    },
  });

  return new NextResponse(readable, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": fileStat.size.toString(),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
