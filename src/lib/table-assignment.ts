import { prisma } from "@/lib/prisma";

interface AssignmentOptions {
  restaurantId: string;
  partySize: number;
  date: Date;
  time: string;
  duration?: number;
  seatingPref?: string | null;
  excludeTableIds?: string[];
}

export async function findBestTable(
  options: AssignmentOptions
): Promise<string | null> {
  const {
    restaurantId,
    partySize,
    date,
    time,
    duration = 90,
    seatingPref,
    excludeTableIds = [],
  } = options;

  // Find all tables that can fit the party
  const tables = await prisma.table.findMany({
    where: {
      restaurantId,
      capacity: { gte: partySize },
      minCapacity: { lte: partySize },
      ...(seatingPref ? { seatingArea: seatingPref } : {}),
      id: { notIn: excludeTableIds },
      combinedWithId: null, // Don't assign combined child tables
    },
    include: {
      reservations: {
        where: {
          date,
          status: { in: ["PENDING", "CONFIRMED", "SEATED"] },
        },
      },
    },
    orderBy: { capacity: "asc" }, // Prefer smallest adequate table
  });

  // Parse requested time
  const [reqHour, reqMin] = time.split(":").map(Number);
  const reqStart = reqHour * 60 + reqMin;
  const reqEnd = reqStart + duration;

  for (const table of tables) {
    // Check for time overlaps with existing reservations
    const hasConflict = table.reservations.some((res) => {
      const [resHour, resMin] = res.time.split(":").map(Number);
      const resStart = resHour * 60 + resMin;
      const resEnd = resStart + res.duration;
      return reqStart < resEnd && reqEnd > resStart;
    });

    if (!hasConflict) {
      return table.id;
    }
  }

  return null;
}
