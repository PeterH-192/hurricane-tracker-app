"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { Guest } from "@/types";
import { useSession } from "next-auth/react";

const TAG_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "purple" | "default"> = {
  VIP: "purple",
  Regular: "info",
  Difficult: "danger",
  Birthday: "warning",
  Anniversary: "success",
};

export default function GuestsPage() {
  const { data: session } = useSession();
  const user = session?.user as Record<string, unknown> | undefined;
  const restaurantId = user?.restaurantId as string;
  const { toast } = useToast();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    tags: [] as string[],
    allergies: "",
    dietaryNotes: "",
    preferences: "",
    internalNotes: "",
  });

  const fetchGuests = useCallback(async () => {
    try {
      const params = search ? `?q=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/guests${params}`);
      if (res.ok) setGuests(await res.json());
    } catch {
      console.error("Failed to fetch guests");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchGuests, 300);
    return () => clearTimeout(timer);
  }, [fetchGuests]);

  function parseTags(tags: string): string[] {
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, restaurantId }),
      });
      if (res.ok) {
        toast("Guest added", "success");
        setShowCreate(false);
        resetForm();
        fetchGuests();
      } else {
        const err = await res.json();
        toast(err.error || "Failed to add guest", "error");
      }
    } catch {
      toast("Failed to add guest", "error");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGuest) return;
    try {
      const res = await fetch(`/api/guests/${selectedGuest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast("Guest updated", "success");
        setSelectedGuest(null);
        fetchGuests();
      }
    } catch {
      toast("Failed to update guest", "error");
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      phone: "",
      email: "",
      tags: [],
      allergies: "",
      dietaryNotes: "",
      preferences: "",
      internalNotes: "",
    });
  }

  function openEdit(guest: Guest) {
    setFormData({
      name: guest.name,
      phone: guest.phone,
      email: guest.email || "",
      tags: parseTags(guest.tags),
      allergies: guest.allergies || "",
      dietaryNotes: guest.dietaryNotes || "",
      preferences: guest.preferences || "",
      internalNotes: guest.internalNotes || "",
    });
    setSelectedGuest(guest);
  }

  function toggleTag(tag: string) {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }

  const guestForm = (
    <div className="space-y-4">
      <Input
        label="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <Input
        label="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        required
      />
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
        <div className="flex flex-wrap gap-2">
          {["VIP", "Regular", "Difficult", "Birthday", "Anniversary"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                formData.tags.includes(tag)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <Input
        label="Allergies"
        value={formData.allergies}
        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
      />
      <Input
        label="Dietary Notes"
        value={formData.dietaryNotes}
        onChange={(e) => setFormData({ ...formData, dietaryNotes: e.target.value })}
      />
      <Input
        label="Preferences"
        value={formData.preferences}
        onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
      />
      <Input
        label="Internal Notes (staff only)"
        value={formData.internalNotes}
        onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Guests</h1>
        <Button
          size="lg"
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
        >
          + Add Guest
        </Button>
      </div>

      <Input
        placeholder="Search by name or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse h-16" />
          ))}
        </div>
      ) : guests.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          {search ? "No guests found matching your search" : "No guests yet"}
        </Card>
      ) : (
        <div className="space-y-2">
          {guests.map((guest) => (
            <Card
              key={guest.id}
              className="flex items-center justify-between p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openEdit(guest)}
            >
              <div>
                <p className="font-semibold">{guest.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {guest.phone}
                  {guest.email && ` · ${guest.email}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {parseTags(guest.tags).map((tag) => (
                  <Badge key={tag} variant={TAG_VARIANTS[tag] || "default"}>{tag}</Badge>
                ))}
                <span className="text-sm text-gray-400">
                  {guest.totalVisits} visits
                </span>
                {guest.noShowCount > 0 && (
                  <Badge variant="danger">{guest.noShowCount} no-shows</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Add Guest">
        <form onSubmit={handleCreate}>
          {guestForm}
          <div className="flex gap-2 mt-4">
            <Button type="submit" size="lg" className="flex-1">Add Guest</Button>
            <Button type="button" variant="outline" size="lg" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!selectedGuest} onClose={() => setSelectedGuest(null)} title={`Edit ${selectedGuest?.name || ""}`}>
        <form onSubmit={handleUpdate}>
          {guestForm}
          {selectedGuest && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900 text-sm">
              <p><strong>Total Visits:</strong> {selectedGuest.totalVisits}</p>
              <p><strong>No-Shows:</strong> {selectedGuest.noShowCount}</p>
              {selectedGuest.lastVisitDate && (
                <p><strong>Last Visit:</strong> {new Date(selectedGuest.lastVisitDate).toLocaleDateString()}</p>
              )}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <Button type="submit" size="lg" className="flex-1">Save</Button>
            <Button type="button" variant="outline" size="lg" onClick={() => setSelectedGuest(null)}>Cancel</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
