export type {
  User,
  Restaurant,
  Table,
  FloorPlan,
  Section,
  Reservation,
  WaitlistEntry,
  Guest,
  Notification,
  TimeSlotConfig,
} from "@prisma/client";

export type {
  Role,
  DiningStatus,
  ReservationStatus,
  WaitlistStatus,
  SeatingArea,
  TableShape,
} from "@/lib/constants";

// Socket event payload types
export interface ReservationPayload {
  id: string;
  guestName: string;
  guestPhone: string;
  partySize: number;
  date: string;
  time: string;
  status: string;
  tableId: string | null;
  tableLabel: string | null;
  seatingPref: string | null;
}

export interface WaitlistEntryPayload {
  id: string;
  guestName: string;
  guestPhone: string;
  partySize: number;
  position: number;
  estimatedWait: number | null;
  status: string;
  seatingPref: string | null;
  trackingToken: string;
}

export interface TableStatusPayload {
  id: string;
  diningStatus: string;
  seatedAt: string | null;
  statusChangedAt: string;
}

export interface NotificationPayload {
  id: string;
  type: string;
  channel: string;
  recipient: string;
  message: string;
  sentAt: string;
}

// Server-to-client events
export interface ServerToClientEvents {
  "reservation:created": (data: ReservationPayload) => void;
  "reservation:updated": (data: ReservationPayload) => void;
  "reservation:cancelled": (data: { id: string }) => void;
  "waitlist:added": (data: WaitlistEntryPayload) => void;
  "waitlist:updated": (data: WaitlistEntryPayload) => void;
  "waitlist:removed": (data: { id: string; reason: string }) => void;
  "waitlist:reordered": (data: { entries: { id: string; position: number; estimatedWait: number | null }[] }) => void;
  "table:statusChanged": (data: TableStatusPayload) => void;
  "table:assigned": (data: { tableId: string; reservationId?: string; waitlistEntryId?: string }) => void;
  "table:released": (data: { tableId: string }) => void;
  "notification:sent": (data: NotificationPayload) => void;
}

// Client-to-server events
export interface ClientToServerEvents {
  "join:restaurant": (data: { restaurantId: string }) => void;
  "leave:restaurant": (data: { restaurantId: string }) => void;
  "join:waitlistTrack": (data: { trackingToken: string }) => void;
}
