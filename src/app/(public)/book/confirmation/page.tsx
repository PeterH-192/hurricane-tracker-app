"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Suspense } from "react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
          <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <CardTitle className="text-2xl">Reservation Confirmed!</CardTitle>

        <p className="text-gray-500 dark:text-gray-400">
          Your reservation has been booked. You&apos;ll receive a confirmation text shortly.
        </p>

        {id && (
          <p className="text-sm text-gray-400">
            Confirmation #: {id.slice(0, 8).toUpperCase()}
          </p>
        )}

        <div className="pt-4">
          <Link
            href="/book"
            className="text-blue-600 hover:underline text-sm"
          >
            Book another table
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
