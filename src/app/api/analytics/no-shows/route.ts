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

    const now = new Date();
    const end = endParam
      ? new Date(endParam + "T23:59:59.999Z")
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const start = startParam
      ? new Date(startParam + "T00:00:00.000Z")
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Count total reservations in range (excluding cancelled, which are intentional removals)
    const totalReservations = await prisma.reservation.count({
      where: {
        restaurantId,
        date: { gte: start, lte: end },
        status: { not: "CANCELLED" },
      },
    });

    // Count no-shows
    const noShows = await prisma.reservation.count({
      where: {
        restaurantId,
        date: { gte: start, lte: end },
        status: "NO_SHOW",
      },
    });

    // Get no-shows grouped by date
    const noShowReservations = await prisma.reservation.findMany({
      where: {
        restaurantId,
        date: { gte: start, lte: end },
        status: "NO_SHOW",
      },
      select: { date: true },
    });

    const noShowsByDate: Record<string, number> = {};
    for (const res of noShowReservations) {
      const dateKey = res.date.toISOString().split("T")[0];
      noShowsByDate[dateKey] = (noShowsByDate[dateKey] || 0) + 1;
    }

    const rate =
      totalReservations > 0
        ? Math.round((noShows / totalReservations) * 10000) / 100
        : 0;

    return NextResponse.json({
      totalReservations,
      noShows,
      noShowRate: rate,
      byDate: Object.entries(noShowsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error) {
    console.error("GET /api/analytics/no-shows error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
