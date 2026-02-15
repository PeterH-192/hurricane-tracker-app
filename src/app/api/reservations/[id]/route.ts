import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { updateReservationSchema } from "@/lib/validators";
import { emitSocketEvent } from "@/lib/socket-emit";

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

    const reservation = await prisma.reservation.findFirst({
      where: { id, restaurantId },
      include: {
        guest: true,
        table: { select: { id: true, label: true, capacity: true } },
        notifications: { orderBy: { sentAt: "desc" } },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("GET /api/reservations/[id] error:", error);
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
    const parsed = updateReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify the reservation exists and belongs to this restaurant
    const existing = await prisma.reservation.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    const data = parsed.data;

    // Build update data with status-related timestamps
    const updateData: Record<string, unknown> = { ...data };

    if (data.date) {
      updateData.date = new Date(data.date + "T00:00:00.000Z");
    }

    if (data.status) {
      switch (data.status) {
        case "CONFIRMED":
          updateData.confirmedAt = new Date();
          break;
        case "SEATED":
          updateData.seatedAt = new Date();
          break;
        case "COMPLETED":
          updateData.completedAt = new Date();
          break;
        case "CANCELLED":
          updateData.cancelledAt = new Date();
          break;
      }
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        table: { select: { id: true, label: true } },
      },
    });

    // Emit socket event
    await emitSocketEvent(
      "reservation:updated",
      `restaurant:${restaurantId}`,
      {
        id: reservation.id,
        guestName: reservation.guestName,
        guestPhone: reservation.guestPhone,
        partySize: reservation.partySize,
        date: reservation.date.toISOString().split("T")[0],
        time: reservation.time,
        status: reservation.status,
        tableId: reservation.tableId,
        tableLabel: reservation.table?.label ?? null,
        seatingPref: reservation.seatingPref,
      }
    );

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("PATCH /api/reservations/[id] error:", error);
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

    const existing = await prisma.reservation.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    await prisma.reservation.delete({ where: { id } });

    await emitSocketEvent(
      "reservation:cancelled",
      `restaurant:${restaurantId}`,
      { id }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/reservations/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
