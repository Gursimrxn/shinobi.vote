'use client';

import Image from "next/image"

const Navbar = () => {
    const handleGoogleSignIn = async () => {
    console.log('Get Started button clicked!');
    try {
      // Use default redirect behavior for OAuth flow
    } catch (error) {
      console.error('SignIn failed:', error);
    }
  };
    return (
        <nav className="relative z-10">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center">
                  <Image src="/logo.png" alt="logo" width={96} height={96} className="scale-[2]" />
                </div>
                <span className="text-2xl font-bold text-gray-800">GhostApp</span>
              </div>
              <button 
                onClick={handleGoogleSignIn}
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