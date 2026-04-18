import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { FamilyData } from "@/types/family";

// ─── Constantes ───────────────────────────────────────────────────────────────

const DATA_PATH = path.join(process.cwd(), "data", "familyData.json");

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg":    "jpg",
  "image/png":     "png",
  "image/webp":    "webp",
  "image/tiff":    "tiff",
  "image/gif":     "gif",
  "image/avif":    "avif",
  "image/svg+xml": "svg",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFolderSlug(id: string, firstName: string, lastName: string): string {
  const sanitize = (s: string) =>
    s.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_áéíóúüñÁÉÍÓÚÜÑ]/g, "");
  return `${sanitize(id)}_${sanitize(firstName)}_${sanitize(lastName)}`;
}

async function readData(): Promise<FamilyData> {
  const raw = await readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

async function writeData(data: FamilyData): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData     = await req.formData();
    const file      = formData.get("file")      as File   | null;
    const personId  = formData.get("personId")  as string | null;
    const firstName = formData.get("firstName") as string | null;
    const lastName  = formData.get("lastName")  as string | null;

    if (!file || !personId || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: file, personId, firstName, lastName" },
        { status: 400 }
      );
    }

    const ext = ALLOWED_MIME[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${file.type}` },
        { status: 415 }
      );
    }

    // ── Guardar imagen en /public ─────────────────────────────────────────────

    const slug       = buildFolderSlug(personId, firstName, lastName);
    const folderPath = path.join(process.cwd(), "public", "persons", slug);
    const fileName   = "00.Avatar.webp";
    const filePath   = path.join(folderPath, fileName);
    const publicUrl  = `/persons/${slug}/${fileName}`;

    await mkdir(folderPath, { recursive: true });

    // Convertir y comprimir a WebP independientemente del formato original
    const buffer = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 100, effort: 5 })
      .toBuffer();

    await writeFile(filePath, webpBuffer);

    // ── Actualizar photoUrl en el JSON ────────────────────────────────────────

    const data  = await readData();
    const index = data.persons.findIndex((p) => p.id === personId);

    if (index === -1) {
      return NextResponse.json(
        { error: `Persona ${personId} no encontrada` },
        { status: 404 }
      );
    }

    data.persons[index] = { ...data.persons[index], photoUrl: publicUrl };
    await writeData(data);

    // Cache buster para forzar re-fetch de la imagen en el browser
    const cacheBuster = Date.now();
    return NextResponse.json(
      { photoUrl: `${publicUrl}?v=${cacheBuster}` },
      { headers: { "Cache-Control": "no-store" } }
    );

  } catch (err) {
    console.error("[upload-avatar]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { personId } = await req.json() as { personId: string };

    if (!personId) {
      return NextResponse.json({ error: "Falta personId" }, { status: 400 });
    }

    const data  = await readData();
    const index = data.persons.findIndex((p) => p.id === personId);

    if (index === -1) {
      return NextResponse.json(
        { error: `Persona ${personId} no encontrada` },
        { status: 404 }
      );
    }

    // Intentar borrar el archivo físico si existe
    const currentUrl = data.persons[index].photoUrl;
    if (currentUrl) {
      try {
        const { unlink, readdir, rmdir } = await import("fs/promises");
        // Quitar query string (?v=...) antes de construir la ruta
        const cleanUrl  = currentUrl.split("?")[0];
        const filePath  = path.join(process.cwd(), "public", cleanUrl);
        await unlink(filePath);

        // Borrar la carpeta si quedó vacía
        const folderPath = path.dirname(filePath);
        const remaining  = await readdir(folderPath);
        if (remaining.length === 0) await rmdir(folderPath);
      } catch {
        // Si el archivo no existe no es un error crítico, seguimos
      }
    }

    // Limpiar photoUrl en el JSON
    data.persons[index] = { ...data.persons[index], photoUrl: null };
    await writeData(data);

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[upload-avatar DELETE]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}