import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = (session.user as Record<string, unknown>)
      .restaurantId as string;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        timeSlotConfigs: {
          orderBy: { dayOfWeek: "asc" },
        },
        sections: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = (session.user as Record<string, unknown>)
      .restaurantId as string;

    const body = await request.json();

    // Whitelist allowed fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "name",
      "timezone",
      "defaultTurnTime",
      "maxPartySize",
      "bookingWindowDays",
      "autoConfirm",
      "sameDayCutoff",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: updateData,
    });

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("PATCH /api/settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
