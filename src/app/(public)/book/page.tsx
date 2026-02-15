"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const TIME_SLOTS = [
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "17:00", "17:30", "18:00", "18:30", "19:00",
  "19:30", "20:00", "20:30", "21:00", "21:30",
];

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    partySize: 2,
    time: "",
    seatingPref: "",
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    specialRequests: "",
  });

  // Default restaurant ID (for demo - in production, this would come from URL/slug)
  const defaultRestaurantSlug = "tableflow-demo";

  async function handleSubmit() {
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          partySize: Number(formData.partySize),
          source: "online",
          // Restaurant ID will be resolved by the API from slug or default
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/book/confirmation?id=${data.id}`);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to create reservation");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="mx-auto max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Book a Table</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Reserve your spot in just a few steps</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${
                s <= step ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Date, Party Size, Time */}
        {step === 1 && (
          <Card className="p-6 space-y-6">
            <CardTitle>When are you coming?</CardTitle>

            <Input
              label="Date"
              type="date"
              value={formData.date}
              min={format(new Date(), "yyyy-MM-dd")}
              max={format(addDays(new Date(), 30), "yyyy-MM-dd")}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Party Size
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PARTY_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFormData({ ...formData, partySize: size })}
                    className={`rounded-lg py-3 text-center font-medium transition-colors min-h-[44px] ${
                      formData.partySize === size
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preferred Time
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setFormData({ ...formData, time })}
                    className={`rounded-lg py-2.5 text-center text-sm font-medium transition-colors min-h-[44px] ${
                      formData.time === time
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                if (!formData.time) {
                  setError("Please select a time");
                  return;
                }
                setError("");
                setStep(2);
              }}
              disabled={!formData.time}
            >
              Next
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </Card>
        )}

        {/* Step 2: Seating Preference */}
        {step === 2 && (
          <Card className="p-6 space-y-6">
            <CardTitle>Seating Preference</CardTitle>

            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "INDOOR", label: "Indoor", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" },
                { value: "OUTDOOR", label: "Outdoor", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" },
                { value: "BAR", label: "Bar", icon: "M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, seatingPref: opt.value })}
                  className={`flex flex-col items-center rounded-xl border-2 p-4 transition-all min-h-[80px] ${
                    formData.seatingPref === opt.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-blue-300 dark:border-gray-600"
                  }`}
                >
                  <svg className="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
                  </svg>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400 text-center">Optional - skip if no preference</p>

            <div className="flex gap-2">
              <Button variant="outline" size="lg" onClick={() => setStep(1)}>Back</Button>
              <Button size="lg" className="flex-1" onClick={() => setStep(3)}>Next</Button>
            </div>
          </Card>
        )}

        {/* Step 3: Contact Info */}
        {step === 3 && (
          <Card className="p-6 space-y-6">
            <CardTitle>Your Information</CardTitle>

            <Input
              label="Name"
              value={formData.guestName}
              onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
              placeholder="John Smith"
              required
            />
            <Input
              label="Phone Number"
              value={formData.guestPhone}
              onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
              placeholder="(555) 123-4567"
              required
            />
            <Input
              label="Email (optional)"
              type="email"
              value={formData.guestEmail}
              onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
              placeholder="john@example.com"
            />
            <Input
              label="Special Requests (optional)"
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              placeholder="High chair, birthday celebration, etc."
            />

            {/* Summary */}
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900 text-sm space-y-1">
              <p><strong>Date:</strong> {formData.date}</p>
              <p><strong>Time:</strong> {formData.time}</p>
              <p><strong>Party Size:</strong> {formData.partySize}</p>
              {formData.seatingPref && <p><strong>Seating:</strong> {formData.seatingPref}</p>}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button variant="outline" size="lg" onClick={() => setStep(2)}>Back</Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={handleSubmit}
                disabled={!formData.guestName || !formData.guestPhone || submitting}
              >
                {submitting ? "Booking..." : "Confirm Reservation"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
