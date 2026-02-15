import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createWaitlistSchema } from "@/lib/validators";
import { calculateEstimatedWait } from "@/lib/wait-time-calculator";
import { emitSocketEvent } from "@/lib/socket-emit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createWaitlistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const restaurantId = data.restaurantId;

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

    // Calculate next position
    const lastEntry = await prisma.waitlistEntry.findFirst({
      where: {
        restaurantId,
        status: { in: ["WAITING", "NOTIFIED", "READY"] },
      },
      orderBy: { position: "desc" },
    });

    const position = (lastEntry?.position ?? 0) + 1;

    // Calculate estimated wait
    const estimatedWait = await calculateEstimatedWait(
      restaurantId,
      data.partySize,
      position,
      data.seatingPref
    );

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
        },
      });
      guestId = newGuest.id;
    }

    const entry = await prisma.waitlistEntry.create({
      data: {
        restaurantId,
        guestId,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        partySize: data.partySize,
        seatingPref: data.seatingPref,
        notes: data.notes,
        position,
        estimatedWait,
        quotedWait: estimatedWait,
      },
    });

    // Emit socket event
    await emitSocketEvent("waitlist:added", `restaurant:${restaurantId}`, {
      id: entry.id,
      guestName: entry.guestName,
      guestPhone: entry.guestPhone,
      partySize: entry.partySize,
      position: entry.position,
      estimatedWait: entry.estimatedWait,
      status: entry.status,
      seatingPref: entry.seatingPref,
      trackingToken: entry.trackingToken,
    });

    // Return tracking token so guest can track their status
    return NextResponse.json(
      {
        id: entry.id,
        trackingToken: entry.trackingToken,
        position: entry.position,
        estimatedWait: entry.estimatedWait,
        status: entry.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/waitlist/join error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
