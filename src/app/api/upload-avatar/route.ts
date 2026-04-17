import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. HELPER — construir el slug de carpeta
// Formato: id_nombre_apellidoPaterno  ej: p1_Helder_Racca
// ─────────────────────────────────────────────────────────────────────────────

function buildFolderSlug(
  id: string,
  nombre: string,
  apellidoPaterno: string
): string {
  const sanitize = (s: string) =>
    s.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_áéíóúüñÁÉÍÓÚÜÑ]/g, "");
  return `${sanitize(id)}_${sanitize(nombre)}_${sanitize(apellidoPaterno)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. HELPER — extensión permitida
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg":    "jpg",
  "image/png":     "png",
  "image/webp":    "webp",
  "image/tiff":    "tiff",
  "image/gif":     "gif",
  "image/avif":    "avif",
  "image/svg+xml": "svg",
};

// ─────────────────────────────────────────────────────────────────────────────
// § 3. HELPER — ruta al familyData.ts para actualizar photoUrl
// ─────────────────────────────────────────────────────────────────────────────

const FAMILY_DATA_PATH = path.join(process.cwd(), "src", "data", "familyData.ts");

async function updatePhotoUrlInSource(personId: string, photoUrl: string) {
  const source = await readFile(FAMILY_DATA_PATH, "utf-8");

  // Busca el bloque del personaje por su id y reemplaza photoUrl
  // Funciona para null y para strings existentes
  const updated = source.replace(
    // Regex: encuentra id: "pX", ... photoUrl: <cualquier valor>
    new RegExp(
    `(id:\\s*"${personId}"[^}]*?photoUrl:\\s*)(?:null|"[^"]*")`,
    "s"  // dotAll — . incluye saltos de línea, sin multiline
  ),
  `$1"${photoUrl}"`
);

  await writeFile(FAMILY_DATA_PATH, updated, "utf-8");
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file         = formData.get("file") as File | null;
    const personId     = formData.get("personId") as string | null;
    const nombre       = formData.get("nombre") as string | null;
    const apellido     = formData.get("apellidoPaterno") as string | null;

    // ── Validaciones ──────────────────────────────────────────────────────────

    if (!file || !personId || !nombre || !apellido) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: file, personId, nombre, apellidoPaterno" },
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

    // ── Construir rutas ───────────────────────────────────────────────────────

    const slug       = buildFolderSlug(personId, nombre, apellido);
    const folderPath = path.join(process.cwd(), "public", "persons", slug);
    const fileName   = `00.Avatar.${ext}`;
    const filePath   = path.join(folderPath, fileName);
    const publicUrl  = `/persons/${slug}/${fileName}`;

    // ── Guardar archivo ───────────────────────────────────────────────────────

    await mkdir(folderPath, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // ── Actualizar familyData.ts ──────────────────────────────────────────────

    await updatePhotoUrlInSource(personId, publicUrl);

    // Al final del POST handler, en el return exitoso:
    // Devolver al cliente con cache buster
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