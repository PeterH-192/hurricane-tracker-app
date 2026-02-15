import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { reorderWaitlistSchema } from "@/lib/validators";
import { calculateEstimatedWait } from "@/lib/wait-time-calculator";
import { emitSocketEvent } from "@/lib/socket-emit";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = (session.user as Record<string, unknown>)
      .restaurantId as string;

    const body = await request.json();
    const parsed = reorderWaitlistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { orderedIds } = parsed.data;

    // Update all positions in a transaction
    const updatedEntries = await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.waitlistEntry.update({
          where: { id },
          data: { position: index + 1 },
        })
      )
    );

    // Recalculate estimated wait times for each entry
    const entriesWithWait: { id: string; position: number; estimatedWait: number | null }[] = [];

    for (const entry of updatedEntries) {
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

      entriesWithWait.push({
        id: entry.id,
        position: entry.position,
        estimatedWait,
      });
    }

    // Emit socket event
    await emitSocketEvent(
      "waitlist:reordered",
      `restaurant:${restaurantId}`,
      { entries: entriesWithWait }
    );

    return NextResponse.json({ entries: entriesWithWait });
  } catch (error) {
    console.error("PATCH /api/waitlist/reorder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
