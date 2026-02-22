"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [registerNumber, setRegisterNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, registerNumber, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to login. Please check your credentials.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to sign in with Google.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1F2232] p-4">
      <div className="w-full max-w-md bg-[#E8DCC4] rounded-[2rem] shadow-xl overflow-hidden">
        <div className="p-8 flex flex-col items-center">
          {/* Logo Section */}
          <div className="mb-8">
            <div className="relative w-64 h-24">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/CHRIST_%28Deemed_to_be_University%29_Logo.png/640px-CHRIST_%28Deemed_to_be_University%29_Logo.png"
                alt="Christ University Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#1F2232] mb-1">Welcome Back</h1>
          <p className="text-[#6B7280] text-sm mb-8">Login to continue</p>

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div className="space-y-2">
              <label htmlFor="registerNumber" className="text-sm font-bold text-[#1F2232] ml-1">
                Register Number
              </label>
              <input
                id="registerNumber"
                type="text"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
                placeholder="Enter your register number"
                required
                className="w-full rounded-lg border-none bg-white px-4 py-3.5 text-sm text-[#1F2232] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1c3d8e]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-bold text-[#1F2232] ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border-none bg-white px-4 py-3.5 pr-12 text-sm text-[#1F2232] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1c3d8e]"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center font-medium mt-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-[#1c3d8e] py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#153075] transition-all active:scale-[0.98] mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="relative w-full my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#E8DCC4] px-2 text-gray-500">OR</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full rounded-lg bg-[#1c3d8e] py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#153075] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

