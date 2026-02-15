import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createTableSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = (session.user as Record<string, unknown>)
      .restaurantId as string;

    const { searchParams } = new URL(request.url);
    const floorPlanId = searchParams.get("floorPlanId");

    const tables = await prisma.table.findMany({
      where: {
        restaurantId,
        ...(floorPlanId ? { floorPlanId } : {}),
      },
      include: {
        section: { select: { id: true, name: true, color: true } },
        floorPlan: { select: { id: true, name: true } },
      },
      orderBy: { label: "asc" },
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error("GET /api/tables error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = (session.user as Record<string, unknown>)
      .restaurantId as string;

    const body = await request.json();
    const parsed = createTableSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const table = await prisma.table.create({
      data: {
        restaurantId,
        floorPlanId: data.floorPlanId,
        sectionId: data.sectionId,
        label: data.label,
        capacity: data.capacity,
        minCapacity: data.minCapacity ?? 1,
        shape: data.shape ?? "SQUARE",
        seatingArea: data.seatingArea ?? "INDOOR",
        posX: data.posX ?? 0,
        posY: data.posY ?? 0,
        width: data.width ?? 60,
        height: data.height ?? 60,
        rotation: data.rotation ?? 0,
      },
      include: {
        section: { select: { id: true, name: true, color: true } },
        floorPlan: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error("POST /api/tables error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
