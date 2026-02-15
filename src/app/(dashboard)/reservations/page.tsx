"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format, addDays, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { useSocket } from "@/hooks/use-socket";
import { useToast } from "@/components/ui/toast";
import type { Reservation } from "@/types";

const STATUS_BADGE_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "default" | "purple"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  SEATED: "info",
  COMPLETED: "default",
  CANCELLED: "danger",
  NO_SHOW: "danger",
};

export default function ReservationsPage() {
  const { data: session } = useSession();
  const user = session?.user as Record<string, unknown> | undefined;
  const restaurantId = user?.restaurantId as string;
  const socket = useSocket(restaurantId);
  const { toast } = useToast();

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    partySize: 2,
    time: "19:00",
    seatingPref: "",
    specialRequests: "",
    source: "phone",
  });

  const fetchReservations = useCallback(async () => {
    try {
      const res = await fetch(`/api/reservations?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      }
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchReservations();
    socket.on("reservation:created", handleUpdate);
    socket.on("reservation:updated", handleUpdate);
    socket.on("reservation:cancelled", handleUpdate);
    return () => {
      socket.off("reservation:created", handleUpdate);
      socket.off("reservation:updated", handleUpdate);
      socket.off("reservation:cancelled", handleUpdate);
    };
  }, [socket, fetchReservations]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          restaurantId,
          date,
          partySize: Number(formData.partySize),
        }),
      });
      if (res.ok) {
        toast("Reservation created", "success");
        setShowCreateDialog(false);
        setFormData({
          guestName: "",
          guestPhone: "",
          guestEmail: "",
          partySize: 2,
          time: "19:00",
          seatingPref: "",
          specialRequests: "",
          source: "phone",
        });
        fetchReservations();
      } else {
        const err = await res.json();
        toast(err.error || "Failed to create reservation", "error");
      }
    } catch {
      toast("Failed to create reservation", "error");
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast(`Reservation ${status.toLowerCase()}`, "success");
        fetchReservations();
        setSelectedReservation(null);
      }
    } catch {
      toast("Failed to update reservation", "error");
    }
  }

  const filtered = reservations.filter(
    (r) => !statusFilter || r.status === statusFilter
  );

  const sortedByTime = [...filtered].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reservations</h1>
        <Button size="lg" onClick={() => setShowCreateDialog(true)}>
          + New Reservation
        </Button>
      </div>

      {/* Date navigation & filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setDate(format(subDays(new Date(date), 1), "yyyy-MM-dd"))}>
          &larr; Prev
        </Button>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-auto"
        />
        <Button variant="outline" size="sm" onClick={() => setDate(format(addDays(new Date(date), 1), "yyyy-MM-dd"))}>
          Next &rarr;
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDate(format(new Date(), "yyyy-MM-dd"))}>
          Today
        </Button>

        <Select
          options={[
            { value: "", label: "All Statuses" },
            { value: "PENDING", label: "Pending" },
            { value: "CONFIRMED", label: "Confirmed" },
            { value: "SEATED", label: "Seated" },
            { value: "COMPLETED", label: "Completed" },
            { value: "CANCELLED", label: "Cancelled" },
            { value: "NO_SHOW", label: "No Show" },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Reservation list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse h-20" />
          ))}
        </div>
      ) : sortedByTime.length === 0 ? (
        <Card className="p-8 text-center text-gray-500 dark:text-gray-400">
          No reservations for {format(new Date(date), "MMMM d, yyyy")}
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedByTime.map((res) => (
            <Card
              key={res.id}
              className="flex items-center justify-between p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedReservation(res)}
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{res.time}</p>
                </div>
                <div>
                  <p className="font-semibold">{res.guestName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Party of {res.partySize}
                    {res.seatingPref && ` · ${res.seatingPref}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(res as Reservation & { table?: { label: string } }).table && (
                  <Badge variant="info">
                    Table {(res as Reservation & { table?: { label: string } }).table?.label}
                  </Badge>
                )}
                <Badge variant={STATUS_BADGE_VARIANT[res.status] || "default"}>
                  {res.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="New Reservation"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Guest Name"
            value={formData.guestName}
            onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
            required
          />
          <Input
            label="Phone"
            value={formData.guestPhone}
            onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
            required
          />
          <Input
            label="Email (optional)"
            type="email"
            value={formData.guestEmail}
            onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Party Size"
              type="number"
              min={1}
              max={20}
              value={formData.partySize}
              onChange={(e) => setFormData({ ...formData, partySize: Number(e.target.value) })}
              required
            />
            <Input
              label="Time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>
          <Select
            label="Seating Preference"
            options={[
              { value: "", label: "No preference" },
              { value: "INDOOR", label: "Indoor" },
              { value: "OUTDOOR", label: "Outdoor" },
              { value: "BAR", label: "Bar" },
            ]}
            value={formData.seatingPref}
            onChange={(e) => setFormData({ ...formData, seatingPref: e.target.value })}
          />
          <Input
            label="Special Requests"
            value={formData.specialRequests}
            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
          />
          <div className="flex gap-2 pt-2">
            <Button type="submit" size="lg" className="flex-1">Create</Button>
            <Button type="button" variant="outline" size="lg" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedReservation}
        onClose={() => setSelectedReservation(null)}
        title="Reservation Details"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><strong>Guest:</strong> {selectedReservation.guestName}</div>
              <div><strong>Phone:</strong> {selectedReservation.guestPhone}</div>
              <div><strong>Party Size:</strong> {selectedReservation.partySize}</div>
              <div><strong>Time:</strong> {selectedReservation.time}</div>
              <div><strong>Status:</strong> <Badge variant={STATUS_BADGE_VARIANT[selectedReservation.status]}>{selectedReservation.status}</Badge></div>
              <div><strong>Seating:</strong> {selectedReservation.seatingPref || "Any"}</div>
              {selectedReservation.specialRequests && (
                <div className="col-span-2"><strong>Notes:</strong> {selectedReservation.specialRequests}</div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {selectedReservation.status === "PENDING" && (
                <Button size="lg" onClick={() => updateStatus(selectedReservation.id, "CONFIRMED")}>
                  Confirm
                </Button>
              )}
              {["PENDING", "CONFIRMED"].includes(selectedReservation.status) && (
                <Button size="lg" variant="secondary" onClick={() => updateStatus(selectedReservation.id, "SEATED")}>
                  Seat
                </Button>
              )}
              {selectedReservation.status === "SEATED" && (
                <Button size="lg" variant="secondary" onClick={() => updateStatus(selectedReservation.id, "COMPLETED")}>
                  Complete
                </Button>
              )}
              {!["CANCELLED", "NO_SHOW", "COMPLETED"].includes(selectedReservation.status) && (
                <>
                  <Button size="lg" variant="destructive" onClick={() => updateStatus(selectedReservation.id, "NO_SHOW")}>
                    No-Show
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => updateStatus(selectedReservation.id, "CANCELLED")}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
