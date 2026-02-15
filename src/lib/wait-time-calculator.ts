import { prisma } from "@/lib/prisma";

export async function calculateEstimatedWait(
  restaurantId: string,
  partySize: number,
  position: number,
  seatingPref?: string | null
): Promise<number> {
  // Get restaurant default turn time
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { defaultTurnTime: true },
  });

  const avgTurnTime = restaurant?.defaultTurnTime ?? 90;

  // Count tables that could accommodate this party
  const suitableTables = await prisma.table.count({
    where: {
      restaurantId,
      capacity: { gte: partySize },
      combinedWithId: null,
      ...(seatingPref ? { seatingArea: seatingPref } : {}),
    },
  });

  // Count tables in late dining stages (likely to free up soon)
  const nearlyAvailable = await prisma.table.count({
    where: {
      restaurantId,
      capacity: { gte: partySize },
      combinedWithId: null,
      diningStatus: { in: ["DESSERT_CHECK", "BUSSING"] },
      ...(seatingPref ? { seatingArea: seatingPref } : {}),
    },
  });

  // Count currently available tables
  const available = await prisma.table.count({
    where: {
      restaurantId,
      capacity: { gte: partySize },
      combinedWithId: null,
      diningStatus: "AVAILABLE",
      ...(seatingPref ? { seatingArea: seatingPref } : {}),
    },
  });

  if (suitableTables === 0) return position * avgTurnTime;

  // If there are available tables and party is first in line
  if (available > 0 && position <= available) return 5;

  // Estimate based on position, available-soon tables, and turn time
  const effectiveAvailable = available + nearlyAvailable;
  if (effectiveAvailable === 0) {
    return Math.ceil((position / suitableTables) * avgTurnTime);
  }

  const cyclesNeeded = Math.ceil(position / effectiveAvailable);
  const estimatedMinutes = cyclesNeeded * (avgTurnTime / 3); // Tables in late stages free faster

  return Math.max(5, Math.round(estimatedMinutes));
}

export async function recalculateAllWaitTimes(
  restaurantId: string
): Promise<void> {
  const entries = await prisma.waitlistEntry.findMany({
    where: {
      restaurantId,
      status: { in: ["WAITING", "NOTIFIED", "READY"] },
    },
    orderBy: { position: "asc" },
  });

  for (const entry of entries) {
    const estimatedWait = await calculateEstimatedWait(
      restaurantId,
      entry.partySize,
      entry.position,
      entry.seatingPref
    );

    await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: { estimatedWait },
    });
  }
}
