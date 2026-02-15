"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { useSocket } from "@/hooks/use-socket";
import { useToast } from "@/components/ui/toast";
import type { WaitlistEntry, Table } from "@/types";

export default function WaitlistPage() {
  const { data: session } = useSession();
  const user = session?.user as Record<string, unknown> | undefined;
  const restaurantId = user?.restaurantId as string;
  const socket = useSocket(restaurantId);
  const { toast } = useToast();

  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSeatDialog, setShowSeatDialog] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState("");

  // Quick add form
  const [addForm, setAddForm] = useState({
    guestName: "",
    guestPhone: "",
    partySize: 2,
    seatingPref: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [waitRes, tableRes] = await Promise.all([
        fetch("/api/waitlist"),
        fetch("/api/tables"),
      ]);
      if (waitRes.ok) setEntries(await waitRes.json());
      if (tableRes.ok) setTables(await tableRes.json());
    } catch (error) {
      console.error("Failed to fetch waitlist:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchData();
    socket.on("waitlist:added", handleUpdate);
    socket.on("waitlist:updated", handleUpdate);
    socket.on("waitlist:removed", handleUpdate);
    socket.on("waitlist:reordered", handleUpdate);
    socket.on("table:statusChanged", handleUpdate);
    return () => {
      socket.off("waitlist:added", handleUpdate);
      socket.off("waitlist:updated", handleUpdate);
      socket.off("waitlist:removed", handleUpdate);
      socket.off("waitlist:reordered", handleUpdate);
      socket.off("table:statusChanged", handleUpdate);
    };
  }, [socket, fetchData]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          restaurantId,
          partySize: Number(addForm.partySize),
        }),
      });
      if (res.ok) {
        toast("Added to waitlist", "success");
        setAddForm({ guestName: "", guestPhone: "", partySize: 2, seatingPref: "" });
        fetchData();
      } else {
        const err = await res.json();
        toast(err.error || "Failed to add", "error");
      }
    } catch {
      toast("Failed to add to waitlist", "error");
    }
  }

  async function handleAction(id: string, action: "NOTIFIED" | "NO_SHOW" | "CANCELLED") {
    try {
      const res = await fetch(`/api/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        toast(
          action === "NO_SHOW" ? "Marked as no-show" : action === "NOTIFIED" ? "Guest notified" : "Removed from waitlist",
          "success"
        );
        fetchData();
      }
    } catch {
      toast("Failed to update", "error");
    }
  }

  async function handleSeat(id: string) {
    if (!selectedTableId) {
      toast("Please select a table", "error");
      return;
    }
    try {
      const res = await fetch(`/api/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SEATED", assignedTableId: selectedTableId }),
      });
      if (res.ok) {
        toast("Guest seated!", "success");
        setShowSeatDialog(null);
        setSelectedTableId("");
        fetchData();
      }
    } catch {
      toast("Failed to seat guest", "error");
    }
  }

  async function handleBump(id: string) {
    try {
      // Move to position 1 by reordering
      const currentEntry = entries.find((e) => e.id === id);
      if (!currentEntry) return;
      const otherIds = entries
        .filter((e) => e.id !== id && ["WAITING", "NOTIFIED", "READY"].includes(e.status))
        .sort((a, b) => a.position - b.position)
        .map((e) => e.id);
      const orderedIds = [id, ...otherIds];

      const res = await fetch("/api/waitlist/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (res.ok) {
        toast("Bumped to front", "success");
        fetchData();
      }
    } catch {
      toast("Failed to bump", "error");
    }
  }

  const activeEntries = entries.filter((e) =>
    ["WAITING", "NOTIFIED", "READY"].includes(e.status)
  );
  const availableTables = tables.filter((t) => t.diningStatus === "AVAILABLE");

  function timeSince(dateStr: string | Date) {
    const mins = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 60000
    );
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Waitlist</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeEntries.length} {activeEntries.length === 1 ? "party" : "parties"} waiting
          </p>
        </div>
      </div>

      {/* Quick Add Form */}
      <Card className="p-4">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <Input
            label="Name"
            value={addForm.guestName}
            onChange={(e) => setAddForm({ ...addForm, guestName: e.target.value })}
            placeholder="Guest name"
            required
            className="flex-1 min-w-[150px]"
          />
          <Input
            label="Phone"
            value={addForm.guestPhone}
            onChange={(e) => setAddForm({ ...addForm, guestPhone: e.target.value })}
            placeholder="Phone number"
            required
            className="flex-1 min-w-[150px]"
          />
          <Input
            label="Party"
            type="number"
            min={1}
            max={20}
            value={addForm.partySize}
            onChange={(e) => setAddForm({ ...addForm, partySize: Number(e.target.value) })}
            className="w-20"
          />
          <Select
            label="Seating"
            options={[
              { value: "", label: "Any" },
              { value: "INDOOR", label: "Indoor" },
              { value: "OUTDOOR", label: "Outdoor" },
              { value: "BAR", label: "Bar" },
            ]}
            value={addForm.seatingPref}
            onChange={(e) => setAddForm({ ...addForm, seatingPref: e.target.value })}
            className="w-32"
          />
          <Button type="submit" size="lg">Add to Waitlist</Button>
        </form>
      </Card>

      {/* Waitlist Entries */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse h-20" />
          ))}
        </div>
      ) : activeEntries.length === 0 ? (
        <Card className="p-8 text-center text-gray-500 dark:text-gray-400">
          No one on the waitlist right now
        </Card>
      ) : (
        <div className="space-y-2">
          {activeEntries
            .sort((a, b) => a.position - b.position)
            .map((entry) => (
              <Card key={entry.id} className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {entry.position}
                    </span>
                    <div>
                      <p className="font-semibold text-lg">{entry.guestName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Party of {entry.partySize}
                        {entry.seatingPref && ` · ${entry.seatingPref}`}
                        {" · Waiting "}
                        {timeSince(entry.joinedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={entry.estimatedWait && entry.estimatedWait <= 10 ? "success" : "warning"}>
                      ~{entry.estimatedWait ?? "?"} min
                    </Badge>
                    {entry.status === "NOTIFIED" && (
                      <Badge variant="info">Notified</Badge>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleBump(entry.id)}>
                      Bump
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAction(entry.id, "NOTIFIED")}
                    >
                      Notify
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowSeatDialog(entry.id);
                        setSelectedTableId("");
                      }}
                    >
                      Seat
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(entry.id, "NO_SHOW")}
                    >
                      No-Show
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* Seat Dialog */}
      <Dialog
        open={!!showSeatDialog}
        onClose={() => setShowSeatDialog(null)}
        title="Select a Table"
      >
        <div className="space-y-4">
          {availableTables.length === 0 ? (
            <p className="text-gray-500">No available tables right now.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {availableTables.map((table) => (
                <button
                  key={table.id}
                  className={`rounded-lg border p-3 text-left transition-colors min-h-[44px] ${
                    selectedTableId === table.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-200 hover:border-blue-300 dark:border-gray-600"
                  }`}
                  onClick={() => setSelectedTableId(table.id)}
                >
                  <p className="font-semibold">{table.label}</p>
                  <p className="text-sm text-gray-500">
                    {table.seatingArea} · Seats {table.capacity}
                  </p>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => showSeatDialog && handleSeat(showSeatDialog)}
              disabled={!selectedTableId}
            >
              Seat Guest
            </Button>
            <Button variant="outline" size="lg" onClick={() => setShowSeatDialog(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
