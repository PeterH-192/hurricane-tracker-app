import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = (session.user as Record<string, unknown>)
      .restaurantId as string;
    const { id } = await params;

    const floorPlan = await prisma.floorPlan.findFirst({
      where: { id, restaurantId },
      include: {
        tables: {
          include: {
            section: { select: { id: true, name: true, color: true } },
          },
          orderBy: { label: "asc" },
        },
      },
    });

    if (!floorPlan) {
      return NextResponse.json(
        { error: "Floor plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(floorPlan);
  } catch (error) {
    console.error("GET /api/floor-plans/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = (session.user as Record<string, unknown>)
      .restaurantId as string;
    const { id } = await params;

    const existing = await prisma.floorPlan.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Floor plan not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Allow updating name, isActive, width, height, backgroundUrl
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.width !== undefined) updateData.width = body.width;
    if (body.height !== undefined) updateData.height = body.height;
    if (body.backgroundUrl !== undefined)
      updateData.backgroundUrl = body.backgroundUrl;

    const floorPlan = await prisma.floorPlan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(floorPlan);
  } catch (error) {
    console.error("PATCH /api/floor-plans/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = (session.user as Record<string, unknown>)
      .restaurantId as string;
    const { id } = await params;

    const existing = await prisma.floorPlan.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Floor plan not found" },
        { status: 404 }
      );
    }

    await prisma.floorPlan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/floor-plans/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
