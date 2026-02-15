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

    // Count total waitlist entries in range (exclude still-active ones)
    const totalEntries = await prisma.waitlistEntry.count({
      where: {
        restaurantId,
        joinedAt: { gte: start, lte: end },
        status: { in: ["SEATED", "CANCELLED", "NO_SHOW"] },
      },
    });

    // Count those that were seated
    const seatedEntries = await prisma.waitlistEntry.count({
      where: {
        restaurantId,
        joinedAt: { gte: start, lte: end },
        status: "SEATED",
      },
    });

    // Count no-shows
    const noShowEntries = await prisma.waitlistEntry.count({
      where: {
        restaurantId,
        joinedAt: { gte: start, lte: end },
        status: "NO_SHOW",
      },
    });

    // Count cancellations
    const cancelledEntries = await prisma.waitlistEntry.count({
      where: {
        restaurantId,
        joinedAt: { gte: start, lte: end },
        status: "CANCELLED",
      },
    });

    // Also count currently active entries
    const activeEntries = await prisma.waitlistEntry.count({
      where: {
        restaurantId,
        joinedAt: { gte: start, lte: end },
        status: { in: ["WAITING", "NOTIFIED", "READY"] },
      },
    });

    const conversionRate =
      totalEntries > 0
        ? Math.round((seatedEntries / totalEntries) * 10000) / 100
        : 0;

    // Calculate average wait time for seated entries
    const seatedWithTimes = await prisma.waitlistEntry.findMany({
      where: {
        restaurantId,
        joinedAt: { gte: start, lte: end },
        status: "SEATED",
        seatedAt: { not: null },
      },
      select: {
        joinedAt: true,
        seatedAt: true,
      },
    });

    let averageWaitMinutes = 0;
    if (seatedWithTimes.length > 0) {
      const totalWait = seatedWithTimes.reduce((sum, entry) => {
        return (
          sum +
          (entry.seatedAt!.getTime() - entry.joinedAt.getTime()) / (1000 * 60)
        );
      }, 0);
      averageWaitMinutes = Math.round(totalWait / seatedWithTimes.length);
    }

    return NextResponse.json({
      totalEntries: totalEntries + activeEntries,
      seatedEntries,
      cancelledEntries,
      noShowEntries,
      activeEntries,
      conversionRate,
      averageWaitMinutes,
    });
  } catch (error) {
    console.error("GET /api/analytics/waitlist-conversion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
