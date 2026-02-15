const SOCKET_SERVER_URL =
  process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";

export async function emitSocketEvent(
  event: string,
  room: string | null,
  data: unknown
): Promise<void> {
  try {
    await fetch(`${SOCKET_SERVER_URL}/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, room, data }),
    });
  } catch (error) {
    console.error("[Socket Emit] Failed to emit event:", error);
  }
}
