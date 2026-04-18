import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { FamilyData, Relation } from "@/types/family";

const DATA_PATH = path.join(process.cwd(), "data", "familyData.json");

async function readData(): Promise<FamilyData> {
  const raw = await readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

async function writeData(data: FamilyData): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const relation = await req.json() as Relation;
    const data     = await readData();

    // Evitar duplicados
    const isDuplicate = data.relations.some((r) => {
      if (r.type !== relation.type) return false;
      if (r.type === "parent-child" && relation.type === "parent-child")
        return r.from === relation.from && r.to === relation.to;
      if (r.type === "couple" && relation.type === "couple")
        return r.persons[0] === relation.persons[0] && r.persons[1] === relation.persons[1];
      return false;
    });

    if (!isDuplicate) {
      data.relations.push(relation);
      await writeData(data);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al agregar la relación" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const relation = await req.json() as Relation;
    const data     = await readData();

    data.relations = data.relations.filter((r) => {
      if (r.type !== relation.type) return true;
      if (r.type === "parent-child" && relation.type === "parent-child")
        return !(r.from === relation.from && r.to === relation.to);
      if (r.type === "couple" && relation.type === "couple")
        return !(r.persons[0] === relation.persons[0] && r.persons[1] === relation.persons[1]);
      return true;
    });

    await writeData(data);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar la relación" },
      { status: 500 }
    );
  }
}