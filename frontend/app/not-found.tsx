import Link from "next/link";
import { Home, Headphones } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-lg mx-auto">

        {/* Animated Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20" />
            <div className="relative rounded-full bg-blue-50 border border-blue-100 p-5 shadow-lg shadow-blue-100">
              <Headphones className="h-14 w-14 text-blue-600" />
            </div>
          </div>
        </div>

        {/* 404 Big Number */}
        <h1 className="text-[10rem] leading-none font-extrabold tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          404
        </h1>

        {/* Divider */}
        <div className="flex items-center justify-center gap-3 my-4">
          <div className="h-px w-16 bg-gray-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Page Not Found</span>
          <div className="h-px w-16 bg-gray-200" />
        </div>

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          We lost this page!
        </h2>

        <p className="mt-3 text-base text-gray-500 max-w-sm mx-auto leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s fly you back to safety.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-white font-semibold shadow-md shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95"
          >
            <Home className="h-4 w-4 text-white transition-transform group-hover:-translate-y-0.5" />
            <span className="text-white">Return Home</span>
          </Link>

          <Link
            href="/contact"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 border border-blue-600 px-8 py-3.5 text-white font-semibold shadow-sm transition-all hover:bg-blue-700 hover:border-blue-700 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-200 active:scale-95"
          >
            <span className="text-white">Contact Support</span>
          </Link>
        </div>

        {/* Footer note */}
        <p className="mt-10 text-xs text-gray-400">
          Error code: <span className="font-mono font-semibold text-gray-500">404_NOT_FOUND</span>
        </p>
      </div>
    </div>
  );
}
