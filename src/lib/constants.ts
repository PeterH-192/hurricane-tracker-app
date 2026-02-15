export const ROLES = ["OWNER", "MANAGER", "HOST", "SERVER"] as const;
export type Role = (typeof ROLES)[number];

export const DINING_STATUSES = [
  "AVAILABLE",
  "RESERVED",
  "SEATED",
  "APPETIZERS",
  "ENTREES",
  "DESSERT_CHECK",
  "BUSSING",
] as const;
export type DiningStatus = (typeof DINING_STATUSES)[number];

export const DINING_STATUS_COLORS: Record<DiningStatus, string> = {
  AVAILABLE: "#22C55E",     // green-500
  RESERVED: "#A855F7",     // purple-500
  SEATED: "#3B82F6",       // blue-500
  APPETIZERS: "#06B6D4",   // cyan-500
  ENTREES: "#F59E0B",      // amber-500
  DESSERT_CHECK: "#F97316", // orange-500
  BUSSING: "#EF4444",      // red-500
};

export const DINING_STATUS_LABELS: Record<DiningStatus, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SEATED: "Seated",
  APPETIZERS: "Appetizers",
  ENTREES: "Entrées",
  DESSERT_CHECK: "Dessert / Check",
  BUSSING: "Bussing",
};

export const DINING_STATUS_FLOW: DiningStatus[] = [
  "AVAILABLE",
  "SEATED",
  "APPETIZERS",
  "ENTREES",
  "DESSERT_CHECK",
  "BUSSING",
  "AVAILABLE",
];

export const RESERVATION_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SEATED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  PENDING: "#F59E0B",
  CONFIRMED: "#22C55E",
  SEATED: "#3B82F6",
  COMPLETED: "#6B7280",
  CANCELLED: "#EF4444",
  NO_SHOW: "#991B1B",
};

export const WAITLIST_STATUSES = [
  "WAITING",
  "NOTIFIED",
  "READY",
  "SEATED",
  "CANCELLED",
  "NO_SHOW",
] as const;
export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];

export const SEATING_AREAS = ["INDOOR", "OUTDOOR", "BAR"] as const;
export type SeatingArea = (typeof SEATING_AREAS)[number];

export const TABLE_SHAPES = ["ROUND", "SQUARE", "RECTANGLE"] as const;
export type TableShape = (typeof TABLE_SHAPES)[number];

export const GUEST_TAG_PRESETS = [
  "VIP",
  "Regular",
  "Difficult",
  "Birthday",
  "Anniversary",
] as const;
