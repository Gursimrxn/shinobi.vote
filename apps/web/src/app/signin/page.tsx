import Navbar from "@/components/Navbar";
import { Features } from "@/components/Features";
import { Highlighter } from "@/components/ui/Highlighter";
import Link from "next/link";
import SignInPageClient from "@/components/signin/SignInPageClient";
import { ProgressiveBlur } from "@/components/ui/ProgressiveBlur";

export const metadata = {
  title: "Sign in • Shinobi.vote",
  description:
    "Verify with Self Protocol to unlock Shinobi's privacy-first governance experience.",
};

export default function SignInPage() {
  return (
    <div className="bg-[#FFFCF4]">
      <div
        className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/illustration.png')",
        }}
      >
  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(255,252,244,0.92)_30%,rgba(255,107,53,0.12)_65%,rgba(111,78,176,0.16)_100%)]" />
        <Navbar />

        <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-12 lg:flex-row lg:items-center lg:gap-16 lg:pt-24">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center justify-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-black/70 shadow-lg shadow-black/5 lg:justify-start">
              <span className="inline-block h-2 w-2 rounded-full bg-[#ff6b35]" />
              Launch Shinobi securely
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight text-black md:text-6xl">
                Verify with <Highlighter action="highlight" color="#FF9800">Self</Highlighter>
                <br />
                and unlock the Ghost Feed
              </h1>
              <p className="text-lg text-black/70 md:text-xl">
                Authenticate using zero-knowledge proofs, keep your identity pseudonymous with ENS, and step into India&apos;s privacy-first DAO experience.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-black/60 lg:justify-start">
              <span className="rounded-full bg-white/80 px-3 py-1">Zero-knowledge proofs</span>
              <span className="rounded-full bg-white/80 px-3 py-1">ENS pseudonyms</span>
              <span className="rounded-full bg-white/80 px-3 py-1">Filecoin storage</span>
            </div>
            <p className="text-sm text-black/60 lg:text-base">
              Looking for the landing page? <Link href="/" className="font-semibold text-black underline-offset-4 transition hover:underline">Go back home</Link>.
            </p>
          </div>
          <div className="flex-1">
            <div className="relative rounded-[36px] border border-black/5 bg-white/85 p-6 shadow-[0_32px_90px_-42px_rgba(22,20,31,0.6)] backdrop-blur">
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6b35]/60 to-transparent" />
              <SignInPageClient />
            </div>
          </div>
        </section>
      </div>

      <section className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(111,78,176,0.1),transparent_65%)]" />
        <h2 className="text-3xl font-semibold leading-tight text-black md:text-5xl">
          One secure sign-in. Infinite anonymous coordination.
        </h2>
        <p className="max-w-3xl text-base text-black/65 md:text-lg">
          Your verification persists across Shinobi proposals, votes, and state DAOs. Signed once, trusted everywhere.
        </p>
        <ProgressiveBlur
          className="pointer-events-none h-48 w-full"
          blurIntensity={0.45}
        />
      </section>

      <footer className="bg-[#FFFCF4] min-h-40 w-full border-t border-black/5">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            <Navbar />
          </div>
          <div className="flex flex-col items-center justify-between gap-3 text-center text-black md:flex-row md:text-left">
            <div>Designed and Developed by</div>
            <div className="flex flex-1 items-center min-w-[120px] min-h-[32px]">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 533 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block" }}
              >
                <path
                  d="M532.854 16.8536C533.049 16.6583 533.049 16.3417 532.854 16.1464L529.672 12.9645C529.476 12.7692 529.16 12.7692 528.964 12.9645C528.769 13.1597 528.769 13.4763 528.964 13.6716L531.793 16.5L528.964 19.3284C528.769 19.5237 528.769 19.8403 528.964 20.0355C529.16 20.2308 529.476 20.2308 529.672 20.0355L532.854 16.8536ZM0 16.5V17H532.5V16.5V16H0V16.5Z"
                  fill="#6F4EB0"
                />
              </svg>
            </div>
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
