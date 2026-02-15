import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { MockSmsService, MockEmailService } from "@/lib/notifications";
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const notifications = await prisma.notification.findMany({
      where: { restaurantId },
      orderBy: { sentAt: "desc" },
      take: limit,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
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

    const { channel, recipient, message, type, reservationId, waitlistEntryId } =
      body;

    if (!channel || !recipient || !message) {
      return NextResponse.json(
        { error: "channel, recipient, and message are required" },
        { status: 400 }
      );
    }

    if (!["SMS", "EMAIL"].includes(channel)) {
      return NextResponse.json(
        { error: "channel must be SMS or EMAIL" },
        { status: 400 }
      );
    }

    const metadata: Record<string, unknown> = {
      restaurantId,
      type: type || "GENERAL",
    };

    if (reservationId) metadata.reservationId = reservationId;
    if (waitlistEntryId) metadata.waitlistEntryId = waitlistEntryId;

    let result: { id: string; success: boolean };

    if (channel === "SMS") {
      const smsService = new MockSmsService();
      result = await smsService.send(recipient, message, metadata);
    } else {
      const emailService = new MockEmailService();
      result = await emailService.send(recipient, message, metadata);
    }

    // Fetch the created notification
    const notification = await prisma.notification.findUnique({
      where: { id: result.id },
    });

    // Emit socket event
    if (notification) {
      await emitSocketEvent(
        "notification:sent",
        `restaurant:${restaurantId}`,
        {
          id: notification.id,
          type: notification.type,
          channel: notification.channel,
          recipient: notification.recipient,
          message: notification.message,
          sentAt: notification.sentAt.toISOString(),
        }
      );
    }

    return NextResponse.json(
      { id: result.id, success: result.success },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
