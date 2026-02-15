"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { DINING_STATUS_COLORS } from "@/lib/constants";
import type { DiningStatus } from "@/lib/constants";
import type { Table } from "@/types";
import Link from "next/link";

export default function FloorPlanEditorPage() {
  const { data: session } = useSession();
  const user = session?.user as Record<string, unknown> | undefined;
  const restaurantId = user?.restaurantId as string;
  const { toast } = useToast();

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);

  const [formData, setFormData] = useState({
    label: "",
    capacity: 4,
    minCapacity: 1,
    shape: "SQUARE",
    seatingArea: "INDOOR",
  });

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

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          restaurantId,
          capacity: Number(formData.capacity),
          minCapacity: Number(formData.minCapacity),
        }),
      });
      if (res.ok) {
        toast("Table added", "success");
        setShowAddDialog(false);
        setFormData({ label: "", capacity: 4, minCapacity: 1, shape: "SQUARE", seatingArea: "INDOOR" });
        fetchTables();
      } else {
        const err = await res.json();
        toast(err.error || "Failed to add table", "error");
      }
    } catch {
      toast("Failed to add table", "error");
    }
  }

  async function handleUpdateTable(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTable) return;
    try {
      const res = await fetch(`/api/tables/${editingTable.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: formData.label,
          capacity: Number(formData.capacity),
          minCapacity: Number(formData.minCapacity),
          shape: formData.shape,
          seatingArea: formData.seatingArea,
        }),
      });
      if (res.ok) {
        toast("Table updated", "success");
        setEditingTable(null);
        fetchTables();
      }
    } catch {
      toast("Failed to update table", "error");
    }
  }

  async function handleDeleteTable(id: string) {
    try {
      const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Table deleted", "success");
        setEditingTable(null);
        fetchTables();
      }
    } catch {
      toast("Failed to delete table", "error");
    }
  }

  function openEdit(table: Table) {
    setFormData({
      label: table.label,
      capacity: table.capacity,
      minCapacity: table.minCapacity,
      shape: table.shape,
      seatingArea: table.seatingArea,
    });
    setEditingTable(table);
  }

  const tableForm = (
    <div className="space-y-4">
      <Input
        label="Table Label"
        value={formData.label}
        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
        placeholder="e.g. T1, B3, Patio-5"
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Max Capacity"
          type="number"
          min={1}
          max={30}
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
        />
        <Input
          label="Min Capacity"
          type="number"
          min={1}
          max={30}
          value={formData.minCapacity}
          onChange={(e) => setFormData({ ...formData, minCapacity: Number(e.target.value) })}
        />
      </div>
      <Select
        label="Shape"
        options={[
          { value: "SQUARE", label: "Square" },
          { value: "ROUND", label: "Round" },
          { value: "RECTANGLE", label: "Rectangle" },
        ]}
        value={formData.shape}
        onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
      />
      <Select
        label="Seating Area"
        options={[
          { value: "INDOOR", label: "Indoor" },
          { value: "OUTDOOR", label: "Outdoor" },
          { value: "BAR", label: "Bar" },
        ]}
        value={formData.seatingArea}
        onChange={(e) => setFormData({ ...formData, seatingArea: e.target.value })}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/floor-plan">
            <Button variant="ghost" size="sm">&larr; Back</Button>
          </Link>
          <h1 className="text-2xl font-bold">Floor Plan Editor</h1>
        </div>
        <Button
          size="lg"
          onClick={() => {
            setFormData({ label: "", capacity: 4, minCapacity: 1, shape: "SQUARE", seatingArea: "INDOOR" });
            setShowAddDialog(true);
          }}
        >
          + Add Table
        </Button>
      </div>

      {/* Visual floor plan (simplified grid - full canvas in future) */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {tables.map((table) => (
            <button
              key={table.id}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-4 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/10 transition-all min-h-[100px]"
              onClick={() => openEdit(table)}
            >
              <div
                className={`mb-2 ${
                  table.shape === "ROUND" ? "rounded-full" : "rounded"
                } flex h-12 w-12 items-center justify-center border-2`}
                style={{
                  borderColor: DINING_STATUS_COLORS[table.diningStatus as DiningStatus],
                  backgroundColor: DINING_STATUS_COLORS[table.diningStatus as DiningStatus] + "20",
                }}
              >
                <span className="text-xs font-bold">{table.label}</span>
              </div>
              <span className="text-xs text-gray-500">{table.capacity} seats</span>
              <span className="text-xs text-gray-400">{table.seatingArea}</span>
            </button>
          ))}
        </div>
      )}

      {tables.length === 0 && !loading && (
        <Card className="p-8 text-center text-gray-500">
          No tables yet. Click &quot;Add Table&quot; to get started.
        </Card>
      )}

      {/* Add Table Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} title="Add Table">
        <form onSubmit={handleAddTable}>
          {tableForm}
          <div className="flex gap-2 mt-4">
            <Button type="submit" size="lg" className="flex-1">Add Table</Button>
            <Button type="button" variant="outline" size="lg" onClick={() => setShowAddDialog(false)}>Cancel</Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={!!editingTable} onClose={() => setEditingTable(null)} title={`Edit Table ${editingTable?.label || ""}`}>
        <form onSubmit={handleUpdateTable}>
          {tableForm}
          <div className="flex gap-2 mt-4">
            <Button type="submit" size="lg" className="flex-1">Save</Button>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={() => editingTable && handleDeleteTable(editingTable.id)}
            >
              Delete
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => setEditingTable(null)}>Cancel</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
