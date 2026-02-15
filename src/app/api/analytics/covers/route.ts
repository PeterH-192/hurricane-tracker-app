import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = (session.user as Record<string, unknown>)
      .restaurantId as string;

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    // Default to last 30 days
    const now = new Date();
    const end = endParam
      ? new Date(endParam + "T23:59:59.999Z")
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const start = startParam
      ? new Date(startParam + "T00:00:00.000Z")
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const reservations = await prisma.reservation.findMany({
      where: {
        restaurantId,
        date: { gte: start, lte: end },
        status: { in: ["CONFIRMED", "SEATED", "COMPLETED"] },
      },
      select: {
        date: true,
        partySize: true,
      },
    });

    // Group by date
    const coversByDate: Record<string, { date: string; covers: number; reservationCount: number }> = {};

    for (const res of reservations) {
      const dateKey = res.date.toISOString().split("T")[0];
      if (!coversByDate[dateKey]) {
        coversByDate[dateKey] = { date: dateKey, covers: 0, reservationCount: 0 };
      }
      coversByDate[dateKey].covers += res.partySize;
      coversByDate[dateKey].reservationCount += 1;
    }

    // Sort by date ascending
    const result = Object.values(coversByDate).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/analytics/covers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
