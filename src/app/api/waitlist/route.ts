import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createWaitlistSchema } from "@/lib/validators";
import { calculateEstimatedWait } from "@/lib/wait-time-calculator";
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
    const status = searchParams.get("status");

    const entries = await prisma.waitlistEntry.findMany({
      where: {
        restaurantId,
        status: status
          ? { in: status.split(",") }
          : { in: ["WAITING", "NOTIFIED", "READY"] },
      },
      include: {
        guest: true,
        assignedTable: { select: { id: true, label: true, capacity: true } },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("GET /api/waitlist error:", error);
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
    const parsed = createWaitlistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

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
      include: {
        assignedTable: { select: { id: true, label: true } },
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

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/waitlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
