import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createReservationSchema } from "@/lib/validators";
import { findBestTable } from "@/lib/table-assignment";
import { MockSmsService } from "@/lib/notifications";
import { emitSocketEvent } from "@/lib/socket-emit";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = (session.user as Record<string, unknown>)
      .restaurantId as string;

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        { error: "Valid date query param required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const date = new Date(dateParam + "T00:00:00.000Z");

    const reservations = await prisma.reservation.findMany({
      where: {
        restaurantId,
        date,
      },
      include: {
        guest: true,
        table: { select: { id: true, label: true, capacity: true } },
      },
      orderBy: { time: "asc" },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("GET /api/reservations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Public endpoint: get restaurantId from body, or from session if authenticated
    let restaurantId = data.restaurantId;

    if (!restaurantId) {
      const session = await auth();
      if (session?.user) {
        restaurantId = (session.user as Record<string, unknown>)
          .restaurantId as string;
      }
    }

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId is required" },
        { status: 400 }
      );
    }

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    const reservationDate = new Date(data.date + "T00:00:00.000Z");

    // Try to find or create guest record
    let guestId: string | undefined;
    const existingGuest = await prisma.guest.findUnique({
      where: {
        restaurantId_phone: {
          restaurantId,
          phone: data.guestPhone,
        },
      },
    });

    if (existingGuest) {
      guestId = existingGuest.id;
    } else {
      const newGuest = await prisma.guest.create({
        data: {
          restaurantId,
          name: data.guestName,
          phone: data.guestPhone,
          email: data.guestEmail || undefined,
        },
      });
      guestId = newGuest.id;
    }

    // Determine initial status
    const status = restaurant.autoConfirm ? "CONFIRMED" : "PENDING";

    // Create the reservation
    const reservation = await prisma.reservation.create({
      data: {
        restaurantId,
        guestId,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail || undefined,
        partySize: data.partySize,
        date: reservationDate,
        time: data.time,
        duration: data.duration ?? restaurant.defaultTurnTime,
        seatingPref: data.seatingPref,
        specialRequests: data.specialRequests,
        source: data.source,
        status,
        confirmedAt: status === "CONFIRMED" ? new Date() : undefined,
      },
      include: {
        table: { select: { id: true, label: true } },
      },
    });

    // Try to auto-assign a table
    const bestTableId = await findBestTable({
      restaurantId,
      partySize: data.partySize,
      date: reservationDate,
      time: data.time,
      duration: data.duration ?? restaurant.defaultTurnTime,
      seatingPref: data.seatingPref,
    });

    let updatedReservation = reservation;
    if (bestTableId) {
      updatedReservation = await prisma.reservation.update({
        where: { id: reservation.id },
        data: { tableId: bestTableId },
        include: {
          table: { select: { id: true, label: true } },
        },
      });
    }

    // Send mock SMS confirmation
    const smsService = new MockSmsService();
    await smsService.send(
      data.guestPhone,
      `Hi ${data.guestName}, your reservation for ${data.partySize} on ${data.date} at ${data.time} has been ${status === "CONFIRMED" ? "confirmed" : "received"}. ${updatedReservation.table ? `Table: ${updatedReservation.table.label}` : ""}`.trim(),
      {
        restaurantId,
        reservationId: reservation.id,
        type: "RESERVATION_CONFIRMATION",
      }
    );

    // Emit socket event
    await emitSocketEvent(
      "reservation:created",
      `restaurant:${restaurantId}`,
      {
        id: updatedReservation.id,
        guestName: updatedReservation.guestName,
        guestPhone: updatedReservation.guestPhone,
        partySize: updatedReservation.partySize,
        date: data.date,
        time: updatedReservation.time,
        status: updatedReservation.status,
        tableId: updatedReservation.tableId,
        tableLabel: updatedReservation.table?.label ?? null,
        seatingPref: updatedReservation.seatingPref,
      }
    );

    return NextResponse.json(updatedReservation, { status: 201 });
  } catch (error) {
    console.error("POST /api/reservations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
