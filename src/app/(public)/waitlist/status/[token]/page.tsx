"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWaitlistTracker } from "@/hooks/use-socket";

interface WaitlistStatus {
  guestName: string;
  partySize: number;
  position: number;
  estimatedWait: number | null;
  status: string;
  seatingPref: string | null;
}

export default function WaitlistStatusPage() {
  const params = useParams();
  const token = params.token as string;
  const socket = useWaitlistTracker(token);
  const [status, setStatus] = useState<WaitlistStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStatus() {
      try {
        // We'll fetch the status via a simple query
        const res = await fetch(`/api/waitlist/join?token=${token}`);
        if (res.ok) {
          setStatus(await res.json());
        } else {
          setError("Could not find your waitlist entry");
        }
      } catch {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, [token]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on("waitlist:updated", (data) => {
      if (data.trackingToken === token) {
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                position: data.position,
                estimatedWait: data.estimatedWait,
                status: data.status,
              }
            : prev
        );
      }
    });

    socket.on("waitlist:reordered", (data) => {
      const myEntry = data.entries.find((e) => {
        // We'd need the ID here, but for simplicity just refetch
        return true;
      });
      if (myEntry) {
        // Refetch to get updated data
        fetch(`/api/waitlist/join?token=${token}`)
          .then((r) => r.json())
          .then(setStatus)
          .catch(() => {});
      }
    });
  }, [socket, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <p className="text-red-600">{error || "Entry not found"}</p>
        </Card>
      </div>
    );
  }

  const isSeated = status.status === "SEATED";
  const isRemoved = ["CANCELLED", "NO_SHOW"].includes(status.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-8">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        {isSeated ? (
          <>
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl">Your Table is Ready!</CardTitle>
            <p className="text-gray-500">Please head to the host stand.</p>
          </>
        ) : isRemoved ? (
          <>
            <CardTitle className="text-2xl">Removed from Waitlist</CardTitle>
            <p className="text-gray-500">Your entry has been removed.</p>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Your position
              </p>
              <p className="text-7xl font-bold text-blue-600 dark:text-blue-400">
                {status.position}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Estimated wait</p>
              <p className="text-2xl font-semibold">
                ~{status.estimatedWait ?? "?"} minutes
              </p>
            </div>

            <div className="space-y-2 text-sm text-gray-500">
              <p><strong>Name:</strong> {status.guestName}</p>
              <p><strong>Party Size:</strong> {status.partySize}</p>
              {status.seatingPref && <p><strong>Seating:</strong> {status.seatingPref}</p>}
            </div>

            {status.status === "NOTIFIED" && (
              <Badge variant="success" className="text-base px-4 py-2">
                Your table is almost ready!
              </Badge>
            )}

            {status.status === "READY" && (
              <Badge variant="success" className="text-base px-4 py-2">
                Your table is READY!
              </Badge>
            )}

            <p className="text-xs text-gray-400">
              This page updates automatically. Keep it open to track your position.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
