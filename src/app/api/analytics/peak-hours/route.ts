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

    const reservations = await prisma.reservation.findMany({
      where: {
        restaurantId,
        date: { gte: start, lte: end },
        status: { in: ["CONFIRMED", "SEATED", "COMPLETED"] },
      },
      select: {
        date: true,
        time: true,
        partySize: true,
      },
    });

    // Build heatmap: dayOfWeek (0-6) x hour (0-23)
    // Initialize the grid
    const heatmap: { dayOfWeek: number; hour: number; count: number; covers: number }[] = [];
    const grid: Record<string, { count: number; covers: number }> = {};

    for (const res of reservations) {
      const dayOfWeek = res.date.getUTCDay();
      const hour = parseInt(res.time.split(":")[0]);
      const key = `${dayOfWeek}-${hour}`;

      if (!grid[key]) {
        grid[key] = { count: 0, covers: 0 };
      }
      grid[key].count += 1;
      grid[key].covers += res.partySize;
    }

    // Convert to array
    for (const [key, data] of Object.entries(grid)) {
      const [dayOfWeek, hour] = key.split("-").map(Number);
      heatmap.push({
        dayOfWeek,
        hour,
        count: data.count,
        covers: data.covers,
      });
    }

    // Sort by dayOfWeek then hour
    heatmap.sort((a, b) =>
      a.dayOfWeek !== b.dayOfWeek
        ? a.dayOfWeek - b.dayOfWeek
        : a.hour - b.hour
    );

    return NextResponse.json(heatmap);
  } catch (error) {
    console.error("GET /api/analytics/peak-hours error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
