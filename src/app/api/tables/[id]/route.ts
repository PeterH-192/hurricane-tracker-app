import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { updateTableSchema } from "@/lib/validators";

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

    const table = await prisma.table.findFirst({
      where: { id, restaurantId },
      include: {
        section: { select: { id: true, name: true, color: true } },
        floorPlan: { select: { id: true, name: true } },
        reservations: {
          where: {
            status: { in: ["PENDING", "CONFIRMED", "SEATED"] },
          },
          orderBy: { time: "asc" },
          select: {
            id: true,
            guestName: true,
            partySize: true,
            time: true,
            status: true,
          },
        },
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error("GET /api/tables/[id] error:", error);
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

    const body = await request.json();
    const parsed = updateTableSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.table.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    const table = await prisma.table.update({
      where: { id },
      data: parsed.data,
      include: {
        section: { select: { id: true, name: true, color: true } },
        floorPlan: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(table);
  } catch (error) {
    console.error("PATCH /api/tables/[id] error:", error);
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

    const existing = await prisma.table.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    await prisma.table.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tables/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
