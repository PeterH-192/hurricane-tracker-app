"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format, subDays } from "date-fns";

interface CoverData {
  date: string;
  covers: number;
}

interface TurnTimeData {
  date: string;
  avgMinutes: number;
}

interface PeakHourData {
  dayOfWeek: number;
  hour: number;
  count: number;
}

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [covers, setCovers] = useState<CoverData[]>([]);
  const [turnTimes, setTurnTimes] = useState<TurnTimeData[]>([]);
  const [noShowRate, setNoShowRate] = useState<number>(0);
  const [peakHours, setPeakHours] = useState<PeakHourData[]>([]);
  const [waitlistConversion, setWaitlistConversion] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const params = `?start=${startDate}&end=${endDate}`;
        const [coversRes, turnRes, noShowRes, peakRes, waitlistRes] = await Promise.all([
          fetch(`/api/analytics/covers${params}`),
          fetch(`/api/analytics/turn-times${params}`),
          fetch(`/api/analytics/no-shows${params}`),
          fetch(`/api/analytics/peak-hours${params}`),
          fetch(`/api/analytics/waitlist-conversion${params}`),
        ]);

        if (coversRes.ok) setCovers(await coversRes.json());
        if (turnRes.ok) {
          const data = await turnRes.json();
          setTurnTimes(Array.isArray(data) ? data : []);
        }
        if (noShowRes.ok) {
          const data = await noShowRes.json();
          setNoShowRate(data.rate ?? 0);
        }
        if (peakRes.ok) setPeakHours(await peakRes.json());
        if (waitlistRes.ok) {
          const data = await waitlistRes.json();
          setWaitlistConversion(data.rate ?? 0);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [startDate, endDate]);

  const totalCovers = covers.reduce((sum, c) => sum + c.covers, 0);
  const avgTurnTime = turnTimes.length > 0
    ? Math.round(turnTimes.reduce((sum, t) => sum + t.avgMinutes, 0) / turnTimes.length)
    : 0;

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const HOURS = Array.from({ length: 14 }, (_, i) => i + 10); // 10am - 11pm

  function getHeatmapColor(count: number, maxCount: number) {
    if (count === 0 || maxCount === 0) return "bg-gray-100 dark:bg-gray-800";
    const intensity = count / maxCount;
    if (intensity > 0.75) return "bg-red-500";
    if (intensity > 0.5) return "bg-orange-400";
    if (intensity > 0.25) return "bg-yellow-300";
    return "bg-green-200 dark:bg-green-800";
  }

  const maxPeakCount = Math.max(...peakHours.map((p) => p.count), 1);

  // Simple bar chart using CSS
  const maxCovers = Math.max(...covers.map((c) => c.covers), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-auto"
          />
          <span className="text-gray-400">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Covers</p>
                <p className="text-3xl font-bold">{totalCovers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Turn Time</p>
                <p className="text-3xl font-bold">{avgTurnTime} min</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400">No-Show Rate</p>
                <p className="text-3xl font-bold">{noShowRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400">Waitlist Conversion</p>
                <p className="text-3xl font-bold">{waitlistConversion.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Cover Count Chart (CSS bars) */}
          <Card>
            <CardTitle className="mb-4">Daily Covers</CardTitle>
            <CardContent>
              {covers.length === 0 ? (
                <p className="text-gray-500 text-sm">No data for this period</p>
              ) : (
                <div className="flex items-end gap-1 h-40 overflow-x-auto">
                  {covers.slice(-30).map((c) => (
                    <div key={c.date} className="flex flex-col items-center flex-shrink-0" style={{ width: "24px" }}>
                      <div
                        className="w-4 bg-blue-500 rounded-t transition-all"
                        style={{ height: `${(c.covers / maxCovers) * 100}%`, minHeight: c.covers > 0 ? "4px" : "0" }}
                      />
                      <span className="text-[9px] text-gray-400 mt-1 rotate-[-45deg]">
                        {c.date.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Peak Hours Heatmap */}
          <Card>
            <CardTitle className="mb-4">Peak Hours</CardTitle>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid gap-1" style={{ gridTemplateColumns: `60px repeat(${HOURS.length}, 1fr)` }}>
                  {/* Header row */}
                  <div />
                  {HOURS.map((h) => (
                    <div key={h} className="text-xs text-center text-gray-400">
                      {h > 12 ? `${h - 12}p` : `${h}a`}
                    </div>
                  ))}
                  {/* Data rows */}
                  {DAYS.map((day, dayIdx) => (
                    <>
                      <div key={`label-${dayIdx}`} className="text-xs text-gray-500 flex items-center">
                        {day}
                      </div>
                      {HOURS.map((hour) => {
                        const cell = peakHours.find(
                          (p) => p.dayOfWeek === dayIdx && p.hour === hour
                        );
                        return (
                          <div
                            key={`${dayIdx}-${hour}`}
                            className={`h-6 rounded ${getHeatmapColor(cell?.count ?? 0, maxPeakCount)}`}
                            title={`${day} ${hour}:00 - ${cell?.count ?? 0} reservations`}
                          />
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
