import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found | Shinobi',
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#FFFCF4] px-6 py-12 text-center">
      <div className="max-w-md">
        <h1 className="text-7xl font-bold text-black tracking-tight">404</h1>
        <p className="mt-4 text-lg text-black/70">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/signin"
            className="px-6 py-3 rounded-full border border-black text-black font-medium hover:bg-black hover:text-white transition-colors"
          >
            Launch App
          </Link>
        </div>
        <p className="mt-10 text-xs uppercase tracking-[0.25em] text-black/40">
          Shinobi • Privacy First Governance
        </p>
      </div>
    </main>
  );
}
