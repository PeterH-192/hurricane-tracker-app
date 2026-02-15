import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { updateTableStatusSchema } from "@/lib/validators";
import { emitSocketEvent } from "@/lib/socket-emit";
import { recalculateAllWaitTimes } from "@/lib/wait-time-calculator";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = (session.user as Record<string, unknown>)
      .restaurantId as string;
    const { id } = await params;

    const body = await request.json();
    const parsed = updateTableStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.table.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    const { diningStatus } = parsed.data;
    const now = new Date();

    // Build update data with timestamps
    const updateData: Record<string, unknown> = {
      diningStatus,
      statusChangedAt: now,
    };

    // Set seatedAt when transitioning to SEATED
    if (diningStatus === "SEATED" && existing.diningStatus !== "SEATED") {
      updateData.seatedAt = now;
    }

    // Clear seatedAt when becoming available
    if (diningStatus === "AVAILABLE") {
      updateData.seatedAt = null;
    }

    const table = await prisma.table.update({
      where: { id },
      data: updateData,
    });

    // Emit socket event
    await emitSocketEvent(
      "table:statusChanged",
      `restaurant:${restaurantId}`,
      {
        id: table.id,
        diningStatus: table.diningStatus,
        seatedAt: table.seatedAt?.toISOString() ?? null,
        statusChangedAt: table.statusChangedAt?.toISOString() ?? now.toISOString(),
      }
    );

    // If table became available, recalculate all wait times
    if (diningStatus === "AVAILABLE") {
      await recalculateAllWaitTimes(restaurantId);
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error("PATCH /api/tables/[id]/status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
