import { z } from "zod";

export const createReservationSchema = z.object({
  restaurantId: z.string().optional(),
  guestName: z.string().min(1).max(100),
  guestPhone: z.string().min(10).max(20),
  guestEmail: z.string().email().optional().or(z.literal("")),
  partySize: z.number().int().min(1).max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().int().min(30).max(300).optional(),
  seatingPref: z.enum(["INDOOR", "OUTDOOR", "BAR"]).optional(),
  specialRequests: z.string().max(500).optional(),
  source: z.enum(["online", "phone", "walk-in"]).default("online"),
});

export const updateReservationSchema = z.object({
  guestName: z.string().min(1).max(100).optional(),
  guestPhone: z.string().min(10).max(20).optional(),
  guestEmail: z.string().email().optional(),
  partySize: z.number().int().min(1).max(20).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration: z.number().int().min(30).max(300).optional(),
  seatingPref: z.enum(["INDOOR", "OUTDOOR", "BAR"]).optional().nullable(),
  specialRequests: z.string().max(500).optional(),
  status: z
    .enum(["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  tableId: z.string().optional().nullable(),
  notes: z.string().max(500).optional(),
});

export const createWaitlistSchema = z.object({
  restaurantId: z.string().optional(),
  guestName: z.string().min(1).max(100),
  guestPhone: z.string().min(10).max(20),
  partySize: z.number().int().min(1).max(20),
  seatingPref: z.enum(["INDOOR", "OUTDOOR", "BAR"]).optional(),
  notes: z.string().max(500).optional(),
});

export const updateWaitlistSchema = z.object({
  status: z
    .enum(["WAITING", "NOTIFIED", "READY", "SEATED", "CANCELLED", "NO_SHOW"])
    .optional(),
  assignedTableId: z.string().optional().nullable(),
  notes: z.string().max(500).optional(),
});

export const reorderWaitlistSchema = z.object({
  orderedIds: z.array(z.string()),
});

export const createTableSchema = z.object({
  restaurantId: z.string().optional(),
  floorPlanId: z.string().optional(),
  sectionId: z.string().optional(),
  label: z.string().min(1).max(20),
  capacity: z.number().int().min(1).max(30),
  minCapacity: z.number().int().min(1).optional(),
  shape: z.enum(["ROUND", "SQUARE", "RECTANGLE"]).optional(),
  seatingArea: z.enum(["INDOOR", "OUTDOOR", "BAR"]).optional(),
  posX: z.number().optional(),
  posY: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
});

export const updateTableSchema = z.object({
  label: z.string().min(1).max(20).optional(),
  capacity: z.number().int().min(1).max(30).optional(),
  minCapacity: z.number().int().min(1).optional(),
  shape: z.enum(["ROUND", "SQUARE", "RECTANGLE"]).optional(),
  seatingArea: z.enum(["INDOOR", "OUTDOOR", "BAR"]).optional(),
  sectionId: z.string().optional().nullable(),
  posX: z.number().optional(),
  posY: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  combinedWithId: z.string().optional().nullable(),
});

export const updateTableStatusSchema = z.object({
  diningStatus: z.enum([
    "AVAILABLE",
    "RESERVED",
    "SEATED",
    "APPETIZERS",
    "ENTREES",
    "DESSERT_CHECK",
    "BUSSING",
  ]),
});

export const createFloorPlanSchema = z.object({
  restaurantId: z.string().optional(),
  name: z.string().min(1).max(50),
  width: z.number().int().min(400).max(3000).optional(),
  height: z.number().int().min(300).max(2000).optional(),
});

export const createGuestSchema = z.object({
  restaurantId: z.string().optional(),
  name: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
  email: z.string().email().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  allergies: z.string().max(500).optional(),
  dietaryNotes: z.string().max(500).optional(),
  preferences: z.string().max(500).optional(),
  internalNotes: z.string().max(1000).optional(),
});

export const updateGuestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
  email: z.string().email().optional().nullable(),
  tags: z.array(z.string()).optional(),
  allergies: z.string().max(500).optional().nullable(),
  dietaryNotes: z.string().max(500).optional().nullable(),
  preferences: z.string().max(500).optional().nullable(),
  internalNotes: z.string().max(1000).optional().nullable(),
});
