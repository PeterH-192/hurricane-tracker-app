import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { updateGuestSchema } from "@/lib/validators";

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

    const guest = await prisma.guest.findFirst({
      where: { id, restaurantId },
      include: {
        reservations: {
          orderBy: { date: "desc" },
          take: 20,
          select: {
            id: true,
            date: true,
            time: true,
            partySize: true,
            status: true,
            createdAt: true,
          },
        },
        waitlistEntries: {
          orderBy: { joinedAt: "desc" },
          take: 10,
          select: {
            id: true,
            partySize: true,
            status: true,
            joinedAt: true,
            seatedAt: true,
          },
        },
      },
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(guest);
  } catch (error) {
    console.error("GET /api/guests/[id] error:", error);
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
    const parsed = updateGuestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.guest.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { ...data };

    // Serialize tags array to JSON string
    if (data.tags) {
      updateData.tags = JSON.stringify(data.tags);
    }

    const guest = await prisma.guest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(guest);
  } catch (error) {
    console.error("PATCH /api/guests/[id] error:", error);
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

    const existing = await prisma.guest.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      );
    }

    await prisma.guest.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/guests/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
