import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { FamilyData, Person } from "@/types/family";

const DATA_PATH = path.join(process.cwd(), "data", "familyData.json");

async function readData(): Promise<FamilyData> {
  const raw = await readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

async function writeData(data: FamilyData): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ─── PUT /api/family/persons/entity — editar persona ─────────────────────────
// Body: { id: string } & Partial<Person>

export async function PUT(req: NextRequest) {
  try {
    const body    = await req.json() as { id: string } & Partial<Person>;
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Falta el campo id" }, { status: 400 });
    }

    const data  = await readData();
    const index = data.persons.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: `Persona ${id} no encontrada` },
        { status: 404 }
      );
    }

    data.persons[index] = { ...data.persons[index], ...updates };
    await writeData(data);

    return NextResponse.json(data.persons[index]);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar la persona" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/family/persons/entity — eliminar persona ────────────────────
// Body: { id: string }

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { id: string };
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Falta el campo id" }, { status: 400 });
    }

    const data   = await readData();
    const exists = data.persons.some((p) => p.id === id);

    if (!exists) {
      return NextResponse.json(
        { error: `Persona ${id} no encontrada` },
        { status: 404 }
      );
    }

    data.persons   = data.persons.filter((p) => p.id !== id);
    data.relations = data.relations.filter((r) => {
      if (r.type === "parent-child") return r.from !== id && r.to !== id;
      if (r.type === "couple")       return !r.persons.includes(id);
      return true;
    });

    await writeData(data);

    return NextResponse.json({ deleted: id });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar la persona" },
      { status: 500 }
    );
  }
}