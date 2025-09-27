import Navbar from "@/components/Navbar";
import Link from "next/link";
import SignInPageClient from "@/components/signin/SignInPageClient";
import { Highlighter } from "@/components/ui/Highlighter";

export const metadata = {
  title: "Sign in • Shinobi.vote",
  description:
    "Verify with Self Protocol to unlock Shinobi's privacy-first governance experience.",
};

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#FFFCF4]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(111,78,176,0.16),_transparent_60%),linear-gradient(140deg,_rgba(255,252,244,0.95)_30%,_rgba(255,107,53,0.12)_70%,_rgba(111,78,176,0.15)_100%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Navbar />
        <Link
          href="/"
          className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium text-black/70 transition hover:bg-white"
        >
          ← Back to home
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16">
        <section className="relative flex flex-1 flex-col overflow-hidden rounded-[36px] border border-black/5 bg-white/75 px-5 py-10 shadow-[0_45px_120px_-70px_rgba(22,20,31,0.65)] backdrop-blur-md sm:px-8 lg:px-12 lg:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(255,252,244,0.95)_15%,rgba(255,107,53,0.1)_55%,rgba(111,78,176,0.18)_100%)]" />
          <div className="pointer-events-none absolute -top-28 right-10 h-48 w-48 rounded-full bg-[#ffb88c]/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-12 h-72 w-72 rounded-full bg-[#7f5ae4]/25 blur-3xl" />
          <div className="relative grid flex-1 gap-12 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
            <div className="flex flex-col justify-center gap-8 text-center text-black lg:text-left">
              <div className="inline-flex items-center justify-center gap-2 self-center rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black/60 shadow-lg shadow-black/5 lg:self-start">
                Ghost feed access
              </div>
              <div className="space-y-5">
                <h1 className="text-balance text-4xl font-bold leading-tight md:text-5xl xl:text-6xl">
                  Verify with{' '}
                  <Highlighter action="highlight" color="#FF9800">
                    Self
                  </Highlighter>{' '}
                  and stay pseudonymous
                </h1>
                <p className="text-lg text-black/65 md:text-xl">
                  Shinobi partners with Self Protocol so proofs stay private while your reputation grows. No passwords—just a quick zero-knowledge handshake.
                </p>
              </div>
              <div className="grid gap-3 text-sm text-black/70 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/5 bg-white/85 px-4 py-3 text-left shadow-sm shadow-black/5">
                  <p className="font-semibold text-black">ZK-powered sign in</p>
                  <p className="text-sm text-black/60">
                    Generate a reusable proof without exposing passport data.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-white/85 px-4 py-3 text-left shadow-sm shadow-black/5">
                  <p className="font-semibold text-black">ENS compatible</p>
                  <p className="text-sm text-black/60">
                    Map your verified identity to ENS for Shinobi governance.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-black/50 lg:justify-start">
                <span>Zero-knowledge proofs</span>
                <span className="hidden sm:inline">•</span>
                <span>ENS pseudonyms</span>
                <span className="hidden sm:inline">•</span>
                <span>Filecoin storage</span>
              </div>
              <p className="text-sm text-black/55 lg:text-base">
                Need the landing page?{' '}
                <Link
                  href="/"
                  className="font-semibold text-black underline-offset-4 transition hover:underline"
                >
                  Go back home
                </Link>
                .
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-lg rounded-[32px] border border-black/5 bg-white/95 p-6 shadow-[0_32px_90px_-42px_rgba(22,20,31,0.65)] backdrop-blur">
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6b35]/60 to-transparent" />
                <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-white/40" />
                <div className="relative z-10">
                  <SignInPageClient />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto w-full border-t border-black/5 bg-[#FFFCF4]/90">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Navbar />
            <div className="flex flex-1 items-center min-w-[120px] min-h-[32px]">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 533 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-8"
              >
                <path
                  d="M532.854 16.8536C533.049 16.6583 533.049 16.3417 532.854 16.1464L529.672 12.9645C529.476 12.7692 529.16 12.7692 528.964 12.9645C528.769 13.1597 528.769 13.4763 528.964 13.6716L531.793 16.5L528.964 19.3284C528.769 19.5237 528.769 19.8403 528.964 20.0355C529.16 20.2308 529.476 20.2308 529.672 20.0355L532.854 16.8536ZM0 16.5V17H532.5V16.5V16H0V16.5Z"
                  fill="#6F4EB0"
                />
              </svg>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 text-center text-black md:flex-row md:text-left">
            <div>Designed and Developed by</div>
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-base">
              <Link
                href="https://github.com/kannusingh"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-purple-700"
              >
                Karandeep Singh
              </Link>
              <span className="hidden md:inline">|</span>
              <Link
                href="https://github.com/gursimrxn"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-purple-700"
              >
                Gursimran Singh
              </Link>
              <span className="hidden md:inline">|</span>
              <Link
                href="https://github.com/singhjashanjot"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-purple-700"
              >
                Jashanjot Singh
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
