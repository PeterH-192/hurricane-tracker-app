import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createGuestSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = (session.user as Record<string, unknown>)
      .restaurantId as string;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    const guests = await prisma.guest.findMany({
      where: {
        restaurantId,
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return NextResponse.json(guests);
  } catch (error) {
    console.error("GET /api/guests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = (session.user as Record<string, unknown>)
      .restaurantId as string;

    const body = await request.json();
    const parsed = createGuestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if guest with this phone already exists
    const existing = await prisma.guest.findUnique({
      where: {
        restaurantId_phone: {
          restaurantId,
          phone: data.phone,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A guest with this phone number already exists" },
        { status: 409 }
      );
    }

    const guest = await prisma.guest.create({
      data: {
        restaurantId,
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        tags: data.tags ? JSON.stringify(data.tags) : "[]",
        allergies: data.allergies,
        dietaryNotes: data.dietaryNotes,
        preferences: data.preferences,
        internalNotes: data.internalNotes,
      },
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    console.error("POST /api/guests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
