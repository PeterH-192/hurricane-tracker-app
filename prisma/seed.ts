import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.table.deleteMany();
  await prisma.section.deleteMany();
  await prisma.floorPlan.deleteMany();
  await prisma.timeSlotConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurant.deleteMany();

  // Create restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "TableFlow Demo Restaurant",
      slug: "tableflow-demo",
      timezone: "America/New_York",
      defaultTurnTime: 90,
      maxPartySize: 12,
      bookingWindowDays: 30,
      autoConfirm: false,
      sameDayCutoff: "16:00",
    },
  });

  console.log(`Created restaurant: ${restaurant.name}`);

  // Create users
  const passwordHash = await hash("password123", 10);

  const owner = await prisma.user.create({
    data: {
      name: "Alex Owner",
      email: "owner@tableflow.com",
      hashedPassword: passwordHash,
      role: "OWNER",
      restaurantId: restaurant.id,
    },
  });

  const host = await prisma.user.create({
    data: {
      name: "Jordan Host",
      email: "host@tableflow.com",
      hashedPassword: passwordHash,
      role: "HOST",
      restaurantId: restaurant.id,
    },
  });

  const server = await prisma.user.create({
    data: {
      name: "Casey Server",
      email: "server@tableflow.com",
      hashedPassword: passwordHash,
      role: "SERVER",
      restaurantId: restaurant.id,
    },
  });

  console.log("Created users: owner, host, server");

  // Create floor plan
  const floorPlan = await prisma.floorPlan.create({
    data: {
      restaurantId: restaurant.id,
      name: "Main Dining Room",
      isActive: true,
      width: 1200,
      height: 800,
    },
  });

  // Create sections
  const indoorSection = await prisma.section.create({
    data: {
      restaurantId: restaurant.id,
      name: "Main Dining",
      color: "#3B82F6",
    },
  });

  const barSection = await prisma.section.create({
    data: {
      restaurantId: restaurant.id,
      name: "Bar Area",
      color: "#F59E0B",
    },
  });

  const patioSection = await prisma.section.create({
    data: {
      restaurantId: restaurant.id,
      name: "Patio",
      color: "#22C55E",
    },
  });

  // Create tables
  const tableData = [
    { label: "T1", capacity: 2, shape: "SQUARE", seatingArea: "INDOOR", sectionId: indoorSection.id, posX: 100, posY: 100 },
    { label: "T2", capacity: 2, shape: "SQUARE", seatingArea: "INDOOR", sectionId: indoorSection.id, posX: 200, posY: 100 },
    { label: "T3", capacity: 4, shape: "SQUARE", seatingArea: "INDOOR", sectionId: indoorSection.id, posX: 300, posY: 100 },
    { label: "T4", capacity: 4, shape: "ROUND", seatingArea: "INDOOR", sectionId: indoorSection.id, posX: 100, posY: 250 },
    { label: "T5", capacity: 6, shape: "RECTANGLE", seatingArea: "INDOOR", sectionId: indoorSection.id, posX: 250, posY: 250, width: 100 },
    { label: "T6", capacity: 8, shape: "RECTANGLE", seatingArea: "INDOOR", sectionId: indoorSection.id, posX: 100, posY: 400, width: 120 },
    { label: "B1", capacity: 2, shape: "SQUARE", seatingArea: "BAR", sectionId: barSection.id, posX: 600, posY: 100 },
    { label: "B2", capacity: 2, shape: "SQUARE", seatingArea: "BAR", sectionId: barSection.id, posX: 700, posY: 100 },
    { label: "B3", capacity: 4, shape: "SQUARE", seatingArea: "BAR", sectionId: barSection.id, posX: 800, posY: 100 },
    { label: "P1", capacity: 4, shape: "ROUND", seatingArea: "OUTDOOR", sectionId: patioSection.id, posX: 600, posY: 400 },
    { label: "P2", capacity: 6, shape: "RECTANGLE", seatingArea: "OUTDOOR", sectionId: patioSection.id, posX: 750, posY: 400, width: 100 },
    { label: "P3", capacity: 2, shape: "ROUND", seatingArea: "OUTDOOR", sectionId: patioSection.id, posX: 900, posY: 400 },
  ];

  for (const t of tableData) {
    await prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        floorPlanId: floorPlan.id,
        label: t.label,
        capacity: t.capacity,
        minCapacity: 1,
        shape: t.shape,
        seatingArea: t.seatingArea,
        sectionId: t.sectionId,
        diningStatus: "AVAILABLE",
        posX: t.posX,
        posY: t.posY,
        width: t.width || 60,
        height: 60,
      },
    });
  }

  console.log(`Created ${tableData.length} tables`);

  // Create time slot configs for each day
  for (let day = 0; day <= 6; day++) {
    await prisma.timeSlotConfig.create({
      data: {
        restaurantId: restaurant.id,
        dayOfWeek: day,
        openTime: day === 0 ? "10:00" : "11:00", // Sunday brunch starts earlier
        closeTime: day >= 5 ? "23:00" : "22:00",  // Fri/Sat close later
        slotDuration: 30,
        maxCovers: 50,
        isActive: true,
      },
    });
  }

  console.log("Created time slot configs");

  // Create guests
  const guests = [
    { name: "Sarah Johnson", phone: "5551234567", email: "sarah@example.com", tags: '["VIP","Regular"]', totalVisits: 12, noShowCount: 0 },
    { name: "Mike Chen", phone: "5552345678", email: "mike@example.com", tags: '["Regular"]', totalVisits: 8, noShowCount: 1 },
    { name: "Emily Rodriguez", phone: "5553456789", email: "emily@example.com", tags: '["Birthday"]', totalVisits: 3, noShowCount: 0, allergies: "Gluten-free" },
    { name: "David Park", phone: "5554567890", email: "david@example.com", tags: '["VIP","Anniversary"]', totalVisits: 15, noShowCount: 0, preferences: "Corner booth preferred" },
    { name: "Lisa Thompson", phone: "5555678901", email: "lisa@example.com", tags: '["Difficult"]', totalVisits: 5, noShowCount: 3, internalNotes: "Frequent complaints about wait times" },
  ];

  const createdGuests = [];
  for (const g of guests) {
    const guest = await prisma.guest.create({
      data: {
        restaurantId: restaurant.id,
        name: g.name,
        phone: g.phone,
        email: g.email,
        tags: g.tags,
        totalVisits: g.totalVisits,
        noShowCount: g.noShowCount,
        allergies: g.allergies || null,
        preferences: g.preferences || null,
        internalNotes: g.internalNotes || null,
      },
    });
    createdGuests.push(guest);
  }

  console.log(`Created ${guests.length} guests`);

  // Create sample reservations for today and upcoming days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reservationData = [
    { guestName: "Sarah Johnson", guestPhone: "5551234567", partySize: 2, time: "18:00", status: "CONFIRMED", date: today, guestId: createdGuests[0].id },
    { guestName: "Mike Chen", guestPhone: "5552345678", partySize: 4, time: "18:30", status: "CONFIRMED", date: today, guestId: createdGuests[1].id },
    { guestName: "Emily Rodriguez", guestPhone: "5553456789", partySize: 3, time: "19:00", status: "PENDING", date: today, guestId: createdGuests[2].id },
    { guestName: "David Park", guestPhone: "5554567890", partySize: 2, time: "19:30", status: "CONFIRMED", date: today, guestId: createdGuests[3].id, seatingPref: "INDOOR" },
    { guestName: "New Guest", guestPhone: "5556789012", partySize: 6, time: "20:00", status: "PENDING", date: today },
    { guestName: "Walk In Party", guestPhone: "5557890123", partySize: 2, time: "20:30", status: "PENDING", date: today, source: "walk-in" },
    // Tomorrow
    { guestName: "Sarah Johnson", guestPhone: "5551234567", partySize: 4, time: "19:00", status: "CONFIRMED", date: new Date(today.getTime() + 86400000), guestId: createdGuests[0].id },
    { guestName: "Large Party", guestPhone: "5558901234", partySize: 8, time: "18:00", status: "PENDING", date: new Date(today.getTime() + 86400000), seatingPref: "INDOOR" },
    // Day after
    { guestName: "Lisa Thompson", guestPhone: "5555678901", partySize: 2, time: "19:00", status: "CONFIRMED", date: new Date(today.getTime() + 172800000), guestId: createdGuests[4].id },
    { guestName: "Birthday Party", guestPhone: "5559012345", partySize: 10, time: "19:30", status: "PENDING", date: new Date(today.getTime() + 172800000), specialRequests: "Birthday celebration - please have a candle ready!" },
  ];

  for (const r of reservationData) {
    await prisma.reservation.create({
      data: {
        restaurantId: restaurant.id,
        guestName: r.guestName,
        guestPhone: r.guestPhone,
        partySize: r.partySize,
        time: r.time,
        date: r.date,
        status: r.status,
        source: r.source || "online",
        seatingPref: r.seatingPref || null,
        specialRequests: r.specialRequests || null,
        guestId: r.guestId || null,
        confirmedAt: r.status === "CONFIRMED" ? new Date() : null,
      },
    });
  }

  console.log(`Created ${reservationData.length} reservations`);

  // Create some waitlist entries
  const waitlistData = [
    { guestName: "Walk-in Family", guestPhone: "5550001111", partySize: 5, position: 1, seatingPref: "INDOOR" },
    { guestName: "Couple Date Night", guestPhone: "5550002222", partySize: 2, position: 2, seatingPref: "OUTDOOR" },
    { guestName: "Business Dinner", guestPhone: "5550003333", partySize: 4, position: 3 },
  ];

  for (const w of waitlistData) {
    await prisma.waitlistEntry.create({
      data: {
        restaurantId: restaurant.id,
        guestName: w.guestName,
        guestPhone: w.guestPhone,
        partySize: w.partySize,
        position: w.position,
        status: "WAITING",
        estimatedWait: w.position * 15,
        quotedWait: w.position * 15,
        seatingPref: w.seatingPref || null,
      },
    });
  }

  console.log(`Created ${waitlistData.length} waitlist entries`);

  console.log("\nSeed completed successfully!");
  console.log("\nDemo Accounts:");
  console.log("  Owner: owner@tableflow.com / password123");
  console.log("  Host:  host@tableflow.com / password123");
  console.log("  Server: server@tableflow.com / password123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
