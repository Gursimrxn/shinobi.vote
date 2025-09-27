'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";

const Navbar = () => {
    const router = useRouter();

    const handleLaunch = () => {
        router.push('/signin');
    };
    return (
        <nav className="relative z-10">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center">
                  <Image src="/logo.png" alt="logo" width={96} height={96} className="" />
                </div>
                <span className="text-2xl font-bold text-gray-800">Shinobi.vote</span>
              </div>
              <button 
                onClick={handleLaunch}
                className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                >
                Launch App
              </button>
            </div>
          </div>
        </nav>
    )
}

export default Navbar;