import { prisma } from "@/lib/prisma";
import type { NotificationService } from "./index";

export class MockEmailService implements NotificationService {
  async send(
    to: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<{ id: string; success: boolean }> {
    console.log(`[MOCK EMAIL] To: ${to}`);
    console.log(`[MOCK EMAIL] Message: ${message}`);
    console.log("---");

    const notification = await prisma.notification.create({
      data: {
        restaurantId: (metadata?.restaurantId as string) || "",
        reservationId: metadata?.reservationId as string | undefined,
        waitlistEntryId: metadata?.waitlistEntryId as string | undefined,
        type: (metadata?.type as string) || "GENERAL",
        channel: "EMAIL",
        recipient: to,
        message,
        mockDelivered: true,
      },
    });

    return { id: notification.id, success: true };
  }
}
