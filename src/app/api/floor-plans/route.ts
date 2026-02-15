import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createFloorPlanSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = (session.user as Record<string, unknown>)
      .restaurantId as string;

    const floorPlans = await prisma.floorPlan.findMany({
      where: { restaurantId },
      include: {
        _count: { select: { tables: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(floorPlans);
  } catch (error) {
    console.error("GET /api/floor-plans error:", error);
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
    const parsed = createFloorPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const floorPlan = await prisma.floorPlan.create({
      data: {
        restaurantId,
        name: data.name,
        width: data.width ?? 1200,
        height: data.height ?? 800,
      },
    });

    return NextResponse.json(floorPlan, { status: 201 });
  } catch (error) {
    console.error("POST /api/floor-plans error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
