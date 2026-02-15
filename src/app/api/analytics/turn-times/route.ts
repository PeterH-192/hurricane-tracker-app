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

    // Get completed reservations that have both seatedAt and completedAt
    const reservations = await prisma.reservation.findMany({
      where: {
        restaurantId,
        status: "COMPLETED",
        date: { gte: start, lte: end },
        seatedAt: { not: null },
        completedAt: { not: null },
      },
      select: {
        seatedAt: true,
        completedAt: true,
        partySize: true,
        date: true,
      },
    });

    if (reservations.length === 0) {
      return NextResponse.json({
        averageTurnTimeMinutes: 0,
        totalCompleted: 0,
        byPartySize: [],
      });
    }

    // Calculate turn times
    let totalTurnTime = 0;
    const byPartySize: Record<number, { total: number; count: number }> = {};

    for (const res of reservations) {
      const turnTime =
        (res.completedAt!.getTime() - res.seatedAt!.getTime()) / (1000 * 60);

      totalTurnTime += turnTime;

      if (!byPartySize[res.partySize]) {
        byPartySize[res.partySize] = { total: 0, count: 0 };
      }
      byPartySize[res.partySize].total += turnTime;
      byPartySize[res.partySize].count += 1;
    }

    const averageTurnTimeMinutes = Math.round(
      totalTurnTime / reservations.length
    );

    const byPartySizeArray = Object.entries(byPartySize)
      .map(([size, data]) => ({
        partySize: parseInt(size),
        averageTurnTimeMinutes: Math.round(data.total / data.count),
        count: data.count,
      }))
      .sort((a, b) => a.partySize - b.partySize);

    return NextResponse.json({
      averageTurnTimeMinutes,
      totalCompleted: reservations.length,
      byPartySize: byPartySizeArray,
    });
  } catch (error) {
    console.error("GET /api/analytics/turn-times error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
