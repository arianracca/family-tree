import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile, readdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { FamilyData } from "@/types/family";

// ─── Constantes ───────────────────────────────────────────────────────────────

const DATA_PATH = path.join(process.cwd(), "data", "familyData.json");
const MAX_AVATARS = 100; // 00–99

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

/**
 * Calcula el siguiente índice de avatar disponible en la carpeta.
 * Lee los archivos existentes con patrón NN.Avatar.webp y devuelve
 * el siguiente número. Si ya hay MAX_AVATARS archivos, reutiliza el 00
 * (límite de seguridad, en la práctica nunca se alcanza).
 */
async function nextAvatarIndex(folderPath: string): Promise<string> {
  try {
    const files = await readdir(folderPath);
    const indices = files
      .map((f) => f.match(/^(\d{2})\.Avatar\.webp$/))
      .filter(Boolean)
      .map((m) => parseInt(m![1], 10));

    if (indices.length === 0) return "00";
    const max = Math.max(...indices);
    const next = (max + 1) % MAX_AVATARS;
    return next.toString().padStart(2, "0");
  } catch {
    // La carpeta no existe todavía
    return "00";
  }
}

// ─── POST — subir o reemplazar avatar ────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData  = await req.formData();
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

    const slug       = buildFolderSlug(personId, firstName, lastName);
    const folderPath = path.join(process.cwd(), "public", "persons", slug);

    await mkdir(folderPath, { recursive: true });

    // ── Numeración incremental — nunca sobreescribe ───────────────────────
    const index    = await nextAvatarIndex(folderPath);
    const fileName = `${index}.Avatar.webp`;
    const filePath = path.join(folderPath, fileName);
    const publicUrl = `/persons/${slug}/${fileName}`;

    const buffer     = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 100, effort: 5 })
      .toBuffer();

    await writeFile(filePath, webpBuffer);

    // ── Actualizar photoUrl en el JSON ────────────────────────────────────
    const data  = await readData();
    const index2 = data.persons.findIndex((p) => p.id === personId);

    if (index2 === -1) {
      return NextResponse.json(
        { error: `Persona ${personId} no encontrada` },
        { status: 404 }
      );
    }

    data.persons[index2] = { ...data.persons[index2], photoUrl: publicUrl };
    await writeData(data);

    const cacheBuster = Date.now();
    return NextResponse.json(
      { photoUrl: `${publicUrl}?v=${cacheBuster}` },
      { headers: { "Cache-Control": "no-store" } }
    );

  } catch (err) {
    console.error("[upload-avatar POST]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ─── DELETE — limpiar photoUrl (el archivo físico lo limpia el batch) ────────
// No borra el archivo físico — eso es responsabilidad del proceso batch.
// Solo pone photoUrl: null en el JSON para que el undo pueda restaurar
// el valor anterior apuntando al archivo que sigue existiendo en disco.

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

    const previousPhotoUrl = data.persons[index].photoUrl ?? null;

    data.persons[index] = { ...data.persons[index], photoUrl: null };
    await writeData(data);

    // Devuelve la URL anterior para que el comando pueda capturarla en el snapshot
    return NextResponse.json({ ok: true, previousPhotoUrl });

  } catch (err) {
    console.error("[upload-avatar DELETE]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}