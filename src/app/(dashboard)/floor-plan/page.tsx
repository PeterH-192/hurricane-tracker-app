"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useSocket } from "@/hooks/use-socket";
import { useToast } from "@/components/ui/toast";
import { DINING_STATUS_COLORS, DINING_STATUS_LABELS, DINING_STATUS_FLOW } from "@/lib/constants";
import type { DiningStatus } from "@/lib/constants";
import type { Table } from "@/types";
import Link from "next/link";

export default function FloorPlanPage() {
  const { data: session } = useSession();
  const user = session?.user as Record<string, unknown> | undefined;
  const restaurantId = user?.restaurantId as string;
  const socket = useSocket(restaurantId);
  const { toast } = useToast();

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch("/api/tables");
      if (res.ok) setTables(await res.json());
    } catch {
      console.error("Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchTables();
    socket.on("table:statusChanged", handleUpdate);
    return () => {
      socket.off("table:statusChanged", handleUpdate);
    };
  }, [socket, fetchTables]);

  async function changeStatus(tableId: string, newStatus: DiningStatus) {
    try {
      const res = await fetch(`/api/tables/${tableId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diningStatus: newStatus }),
      });
      if (res.ok) {
        toast(`Table updated to ${DINING_STATUS_LABELS[newStatus]}`, "success");
        fetchTables();
        setSelectedTable(null);
      }
    } catch {
      toast("Failed to update table status", "error");
    }
  }

  function getNextStatus(current: DiningStatus): DiningStatus {
    const idx = DINING_STATUS_FLOW.indexOf(current);
    if (idx === -1 || idx >= DINING_STATUS_FLOW.length - 1) return "AVAILABLE";
    return DINING_STATUS_FLOW[idx + 1];
  }

  function timeSinceStatus(table: Table) {
    if (!table.statusChangedAt) return "";
    const mins = Math.floor((Date.now() - new Date(table.statusChangedAt).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Floor Plan</h1>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Floor Plan</h1>
        <Link href="/floor-plan/editor">
          <Button variant="outline">Edit Layout</Button>
        </Link>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(DINING_STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: DINING_STATUS_COLORS[status as DiningStatus] }}
            />
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Table Grid (simplified view - canvas version in editor) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {tables.map((table) => {
          const status = table.diningStatus as DiningStatus;
          return (
            <button
              key={table.id}
              className="flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all hover:scale-105 min-h-[100px]"
              style={{
                borderColor: DINING_STATUS_COLORS[status],
                backgroundColor: DINING_STATUS_COLORS[status] + "15",
              }}
              onClick={() => setSelectedTable(table)}
            >
              <span className="text-xl font-bold">{table.label}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {table.capacity} seats · {table.seatingArea}
              </span>
              <Badge
                variant={status === "AVAILABLE" ? "success" : status === "BUSSING" ? "danger" : "info"}
                className="mt-2"
              >
                {DINING_STATUS_LABELS[status]}
              </Badge>
              {table.statusChangedAt && status !== "AVAILABLE" && (
                <span className="text-xs text-gray-400 mt-1">{timeSinceStatus(table)}</span>
              )}
            </button>
          );
        })}
      </div>

      {tables.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          No tables yet.{" "}
          <Link href="/floor-plan/editor" className="text-blue-600 hover:underline">
            Create your floor plan
          </Link>
        </Card>
      )}

      {/* Table Detail Dialog */}
      <Dialog
        open={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        title={selectedTable ? `Table ${selectedTable.label}` : ""}
      >
        {selectedTable && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><strong>Capacity:</strong> {selectedTable.capacity}</div>
              <div><strong>Area:</strong> {selectedTable.seatingArea}</div>
              <div><strong>Shape:</strong> {selectedTable.shape}</div>
              <div>
                <strong>Status:</strong>{" "}
                <Badge>{DINING_STATUS_LABELS[selectedTable.diningStatus as DiningStatus]}</Badge>
              </div>
              {selectedTable.statusChangedAt && (
                <div><strong>Since:</strong> {timeSinceStatus(selectedTable)}</div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Change Status:</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(DINING_STATUS_LABELS).map(([status, label]) => (
                  <Button
                    key={status}
                    variant={selectedTable.diningStatus === status ? "default" : "outline"}
                    size="lg"
                    onClick={() => changeStatus(selectedTable.id, status as DiningStatus)}
                    disabled={selectedTable.diningStatus === status}
                    className="justify-start"
                  >
                    <span
                      className="mr-2 h-3 w-3 rounded-full inline-block"
                      style={{ backgroundColor: DINING_STATUS_COLORS[status as DiningStatus] }}
                    />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() =>
                changeStatus(
                  selectedTable.id,
                  getNextStatus(selectedTable.diningStatus as DiningStatus)
                )
              }
            >
              Next: {DINING_STATUS_LABELS[getNextStatus(selectedTable.diningStatus as DiningStatus)]}
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
