"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SelfVerificationComponent from "@/components/SelfVerification";
import type { SelfVerificationData } from "@/types/self";

export function SignInPageClient() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [verificationData, setVerificationData] = useState<
    SelfVerificationData | null
  >(null);

  const handleVerificationComplete = useCallback(
    (data: SelfVerificationData) => {
      setVerificationData(data);
    },
    []
  );

  useEffect(() => {
    if (!verificationData || redirecting) {
      return;
    }

    setRedirecting(true);
    const timeout = setTimeout(() => {
      router.push("/home");
    }, 1200);

    return () => {
      clearTimeout(timeout);
    };
  }, [verificationData, redirecting, router]);

  const redirectCopy = useMemo(() => {
    if (!verificationData) {
      return null;
    }

    return {
      heading: "Identity verified",
      message: "Redirecting you to the Ghost Feed…",
    };
  }, [verificationData]);

  return (
    <div className="relative flex w-full max-w-xl flex-col items-center justify-center gap-6">
      <SelfVerificationComponent
        className="w-full backdrop-blur-xl"
        onVerificationComplete={handleVerificationComplete}
      />
      {redirectCopy && (
        <div className="flex w-full flex-col gap-2 rounded-2xl border border-black/10 bg-white/70 px-5 py-4 text-left text-sm text-black shadow-[0_18px_55px_-32px_rgba(22,20,31,0.35)] dark:border-white/10 dark:bg-white/10 dark:text-white">
          <p className="text-base font-semibold">{redirectCopy.heading}</p>
          <p className="text-sm text-black/60 dark:text-white/70">
            {redirectCopy.message}
          </p>
        </div>
      )}
    </div>
  );
}

export default SignInPageClient;
