"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import type { Restaurant } from "@/types";
import Link from "next/link";

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Partial<Restaurant>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) setSettings(await res.json());
      } catch {
        console.error("Failed to fetch settings");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settings.name,
          defaultTurnTime: Number(settings.defaultTurnTime),
          maxPartySize: Number(settings.maxPartySize),
          bookingWindowDays: Number(settings.bookingWindowDays),
          autoConfirm: settings.autoConfirm,
          sameDayCutoff: settings.sameDayCutoff,
        }),
      });
      if (res.ok) {
        toast("Settings saved", "success");
      }
    } catch {
      toast("Failed to save settings", "error");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Card className="animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card className="p-6">
        <CardTitle className="mb-4">Restaurant Settings</CardTitle>
        <form onSubmit={handleSave} className="space-y-4 max-w-lg">
          <Input
            label="Restaurant Name"
            value={settings.name || ""}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
          />
          <Input
            label="Default Turn Time (minutes)"
            type="number"
            min={30}
            max={300}
            value={settings.defaultTurnTime || 90}
            onChange={(e) => setSettings({ ...settings, defaultTurnTime: Number(e.target.value) })}
          />
          <Input
            label="Max Party Size"
            type="number"
            min={1}
            max={50}
            value={settings.maxPartySize || 12}
            onChange={(e) => setSettings({ ...settings, maxPartySize: Number(e.target.value) })}
          />
          <Input
            label="Booking Window (days ahead)"
            type="number"
            min={1}
            max={180}
            value={settings.bookingWindowDays || 30}
            onChange={(e) => setSettings({ ...settings, bookingWindowDays: Number(e.target.value) })}
          />
          <Input
            label="Same-Day Cutoff Time"
            type="time"
            value={settings.sameDayCutoff || "16:00"}
            onChange={(e) => setSettings({ ...settings, sameDayCutoff: e.target.value })}
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoConfirm"
              checked={settings.autoConfirm || false}
              onChange={(e) => setSettings({ ...settings, autoConfirm: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="autoConfirm" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto-confirm reservations
            </label>
          </div>
          <Button type="submit" size="lg">Save Settings</Button>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/settings/time-slots">
          <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
            <CardTitle>Time Slots</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure booking windows and operating hours
            </p>
          </Card>
        </Link>
        <Link href="/settings/sections">
          <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
            <CardTitle>Server Sections</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage table sections and server assignments
            </p>
          </Card>
        </Link>
        <Link href="/settings/users">
          <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
            <CardTitle>User Management</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Invite staff and manage roles
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
