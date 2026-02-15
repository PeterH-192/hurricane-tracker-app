import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { updateWaitlistSchema } from "@/lib/validators";
import { emitSocketEvent } from "@/lib/socket-emit";

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
    const parsed = updateWaitlistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.waitlistEntry.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { ...data };

    // Handle status-specific timestamps
    if (data.status) {
      switch (data.status) {
        case "NOTIFIED":
          updateData.notifiedAt = new Date();
          break;
        case "SEATED":
          updateData.seatedAt = new Date();
          break;
        case "CANCELLED":
        case "NO_SHOW":
          updateData.removedAt = new Date();
          break;
      }
    }

    const entry = await prisma.waitlistEntry.update({
      where: { id },
      data: updateData,
      include: {
        assignedTable: { select: { id: true, label: true } },
      },
    });

    // Emit socket event
    await emitSocketEvent(
      "waitlist:updated",
      `restaurant:${restaurantId}`,
      {
        id: entry.id,
        guestName: entry.guestName,
        guestPhone: entry.guestPhone,
        partySize: entry.partySize,
        position: entry.position,
        estimatedWait: entry.estimatedWait,
        status: entry.status,
        seatingPref: entry.seatingPref,
        trackingToken: entry.trackingToken,
      }
    );

    return NextResponse.json(entry);
  } catch (error) {
    console.error("PATCH /api/waitlist/[id] error:", error);
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

    const existing = await prisma.waitlistEntry.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    await prisma.waitlistEntry.delete({ where: { id } });

    await emitSocketEvent(
      "waitlist:removed",
      `restaurant:${restaurantId}`,
      { id, reason: "deleted" }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/waitlist/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
