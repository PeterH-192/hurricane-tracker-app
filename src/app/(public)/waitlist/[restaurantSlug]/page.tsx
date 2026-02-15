"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";

export default function WaitlistJoinPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.restaurantSlug as string;

  const [formData, setFormData] = useState({
    guestName: "",
    guestPhone: "",
    partySize: 2,
    seatingPref: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          partySize: Number(formData.partySize),
          restaurantSlug: slug,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/waitlist/status/${data.trackingToken}`);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to join waitlist");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-8">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-6">
          <CardTitle className="text-2xl">Join the Waitlist</CardTitle>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            We&apos;ll text you when your table is ready
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.guestName}
            onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
            placeholder="Your name"
            required
          />
          <Input
            label="Phone Number"
            value={formData.guestPhone}
            onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
            placeholder="(555) 123-4567"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Party Size
            </label>
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFormData({ ...formData, partySize: size })}
                  className={`rounded-lg py-3 text-center font-medium min-h-[44px] ${
                    formData.partySize === size
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seating Preference
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "", label: "Any" },
                { value: "INDOOR", label: "Indoor" },
                { value: "OUTDOOR", label: "Outdoor" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, seatingPref: opt.value })}
                  className={`rounded-lg py-2 text-sm font-medium min-h-[44px] ${
                    formData.seatingPref === opt.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Joining..." : "Join Waitlist"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
