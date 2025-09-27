import Image from "next/image";
import SelfVerificationComponent from "@/components/SelfVerification";

export default function Home() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20">
      <header className="max-w-4xl mx-auto text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <span className="text-2xl font-bold text-gray-500">×</span>
          <div className="text-2xl font-bold text-blue-600">Self Protocol</div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          GhostApp
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          A decentralized identity verification app powered by Self Protocol. 
          Verify your identity securely using zero-knowledge proofs without revealing sensitive information.
        </p>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Why Self Protocol?
              </h2>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Privacy First:</strong> Zero-knowledge proofs protect your personal data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Decentralized:</strong> No central authority controls your identity</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Secure:</strong> Cryptographic proofs ensure authenticity</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Selective Disclosure:</strong> Share only what's necessary</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                How it works:
              </h3>
              <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><span className="font-semibold">1.</span> Scan the QR code with your Self wallet</li>
                <li><span className="font-semibold">2.</span> Approve the identity verification request</li>
                <li><span className="font-semibold">3.</span> Your identity is verified without revealing personal data</li>
                <li><span className="font-semibold">4.</span> Access granted with cryptographic proof</li>
              </ol>
            </div>
          </div>

          <div>
            <SelfVerificationComponent />
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="flex gap-4 items-center justify-center flex-col sm:flex-row">
            <a
              className="rounded-full border border-solid border-blue-600 bg-blue-600 text-white transition-colors flex items-center justify-center hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-6 sm:px-8"
              href="https://docs.self.xyz"
              target="_blank"
              rel="noopener noreferrer"
            >
              📚 Self Protocol Docs
            </a>
            <a
              className="rounded-full border border-solid border-gray-300 dark:border-gray-600 transition-colors flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-sm sm:text-base h-10 sm:h-12 px-6 sm:px-8"
              href="https://github.com/Gursimrxn/ghostapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              💻 View Source
            </a>
          </div>
        </div>
      </main>

      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Built with ❤️ using{' '}
            <a href="https://nextjs.org" className="text-blue-600 hover:underline">Next.js</a> and{' '}
            <a href="https://self.xyz" className="text-blue-600 hover:underline">Self Protocol</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
