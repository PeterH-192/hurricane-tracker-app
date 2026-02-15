import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";

export default async function RootPage() {
  const session = await auth();

  if (session?.user) {
    // The dashboard is served by the (dashboard) route group at /
    // If we're here and authenticated, show the dashboard
    // This shouldn't normally be reached since (dashboard)/page.tsx handles /
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white">TableFlow</h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-md">
          Modern restaurant reservation and waitlist management
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-6 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Staff Login
          </Link>
          <Link
            href="/book"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-gray-300 px-6 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors"
          >
            Book a Table
          </Link>
        </div>
      </div>
    </div>
  );
}
