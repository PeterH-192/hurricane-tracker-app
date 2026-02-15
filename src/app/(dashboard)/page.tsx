"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/hooks/use-socket";
import { format } from "date-fns";

interface DashboardStats {
  tonightReservations: number;
  waitlistLength: number;
  openTables: number;
  nextAvailableTime: string | null;
  upcomingReservations: Array<{
    id: string;
    guestName: string;
    partySize: number;
    time: string;
    status: string;
  }>;
  activeWaitlist: Array<{
    id: string;
    guestName: string;
    partySize: number;
    estimatedWait: number | null;
    position: number;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as Record<string, unknown> | undefined;
  const restaurantId = user?.restaurantId as string;
  const socket = useSocket(restaurantId);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const today = format(new Date(), "yyyy-MM-dd");
        const [resRes, waitRes, tableRes] = await Promise.all([
          fetch(`/api/reservations?date=${today}`),
          fetch("/api/waitlist"),
          fetch("/api/tables"),
        ]);

        const reservations = resRes.ok ? await resRes.json() : [];
        const waitlist = waitRes.ok ? await waitRes.json() : [];
        const tables = tableRes.ok ? await tableRes.json() : [];

        const openTables = tables.filter(
          (t: { diningStatus: string }) => t.diningStatus === "AVAILABLE"
        ).length;

        setStats({
          tonightReservations: reservations.length,
          waitlistLength: waitlist.filter(
            (w: { status: string }) => w.status === "WAITING" || w.status === "NOTIFIED"
          ).length,
          openTables,
          nextAvailableTime: null,
          upcomingReservations: reservations
            .filter((r: { status: string }) => ["PENDING", "CONFIRMED"].includes(r.status))
            .slice(0, 5),
          activeWaitlist: waitlist
            .filter((w: { status: string }) => w.status === "WAITING")
            .slice(0, 5),
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    if (restaurantId) fetchStats();
  }, [restaurantId]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      // Re-fetch stats on any change
      const today = format(new Date(), "yyyy-MM-dd");
      fetch(`/api/reservations?date=${today}`)
        .then((r) => r.json())
        .catch(() => []);
    };

    socket.on("reservation:created", handleUpdate);
    socket.on("reservation:updated", handleUpdate);
    socket.on("waitlist:added", handleUpdate);
    socket.on("waitlist:removed", handleUpdate);
    socket.on("table:statusChanged", handleUpdate);

    return () => {
      socket.off("reservation:created", handleUpdate);
      socket.off("reservation:updated", handleUpdate);
      socket.off("waitlist:added", handleUpdate);
      socket.off("waitlist:removed", handleUpdate);
      socket.off("table:statusChanged", handleUpdate);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tonight&apos;s Reservations</p>
                <p className="text-3xl font-bold">{stats?.tonightReservations ?? 0}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Waitlist</p>
                <p className="text-3xl font-bold">{stats?.waitlistLength ?? 0}</p>
              </div>
              <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Open Tables</p>
                <p className="text-3xl font-bold">{stats?.openTables ?? 0}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Next Available</p>
                <p className="text-3xl font-bold">{stats?.nextAvailableTime ?? "Now"}</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Reservations & Active Waitlist */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Upcoming Reservations</CardTitle>
          <CardContent>
            {stats?.upcomingReservations.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming reservations tonight</p>
            ) : (
              <div className="space-y-3">
                {stats?.upcomingReservations.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700"
                  >
                    <div>
                      <p className="font-medium">{res.guestName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Party of {res.partySize} at {res.time}
                      </p>
                    </div>
                    <Badge
                      variant={res.status === "CONFIRMED" ? "success" : "warning"}
                    >
                      {res.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle className="mb-4">Active Waitlist</CardTitle>
          <CardContent>
            {stats?.activeWaitlist.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No one on the waitlist</p>
            ) : (
              <div className="space-y-3">
                {stats?.activeWaitlist.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {entry.position}
                      </span>
                      <div>
                        <p className="font-medium">{entry.guestName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Party of {entry.partySize}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ~{entry.estimatedWait ?? "?"} min
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
