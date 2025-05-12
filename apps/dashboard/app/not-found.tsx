import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary-100 to-primary-300 px-4">
      <div className="flex flex-col items-center">
        {/* SVG Illustration */}
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          fill="none"
          className="mb-6"
        >
          <circle cx="90" cy="90" r="90" fill="#f3f4f6" />
          <ellipse cx="90" cy="130" rx="50" ry="12" fill="#e5e7eb" />
          <rect x="60" y="60" width="60" height="40" rx="8" fill="#d1d5db" />
          <rect x="75" y="75" width="30" height="10" rx="5" fill="#fff" />
          <circle cx="75" cy="85" r="3" fill="#fff" />
          <circle cx="105" cy="85" r="3" fill="#fff" />
        </svg>
        <h1 className="text-6xl font-extrabold text-primary-700 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-primary-800 mb-4">
          Page Not Found
        </h2>
        <p className="text-center text-primary-600 mb-8 max-w-md">
          Oops! The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary-700 text-white rounded-lg shadow hover:bg-primary-800 transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
