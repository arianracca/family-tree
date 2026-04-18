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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Omit<Person, "id">;

    const data = await readData();

    // Generar ID único
    const existingNums = data.persons
      .map((p) => parseInt(p.id.replace("p", ""), 10))
      .filter((n) => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    const id = `p${nextNum}`;

    const newPerson: Person = { id, ...body };
    data.persons.push(newPerson);

    await writeData(data);

    return NextResponse.json(newPerson, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear la persona" },
      { status: 500 }
    );
  }
}