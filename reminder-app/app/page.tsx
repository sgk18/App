import Image from "next/image";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1f2437]">
      <div className="bg-[#d6c9ae] w-[420px] p-10 rounded-[40px] shadow-2xl">

        {/* University Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/christ-logo.png"
            alt="University Logo"
            width={140}
            height={60}
            className="object-contain"
          />
        </div>

        {/* Title */}
        <h2 className="text-4xl font-bold text-center text-[#1f2437] mb-10">
          Login to continue
        </h2>

        {/* Register Number */}
        <label className="block text-[#1f2437] font-semibold mb-2">
          Register Number:
        </label>
        <input
          type="text"
          placeholder="Enter your register number"
          className="w-full p-4 mb-6 rounded-2xl bg-white text-black placeholder-gray-500 focus:outline-none"
        />

        {/* Password */}
        <label className="block text-[#1f2437] font-semibold mb-2">
          Password:
        </label>
        <input
          type="password"
          placeholder="Enter your password"
          className="w-full p-4 mb-8 rounded-2xl bg-white text-black placeholder-gray-500 focus:outline-none"
        />

        {/* Login Button */}
        <button className="w-full bg-[#2c4a9e] text-white p-4 rounded-2xl font-semibold shadow-md hover:opacity-90 transition">
          Login
        </button>

        {/* OR Divider */}
        <div className="flex items-center my-8">
          <div className="flex-grow border-t border-gray-400"></div>
          <span className="mx-4 text-gray-600 font-medium">OR</span>
          <div className="flex-grow border-t border-gray-400"></div>
        </div>

        {/* Google Button */}
        <button className="w-full bg-[#2c4a9e] text-white p-4 rounded-2xl font-semibold shadow-md hover:opacity-90 transition flex items-center justify-center gap-3">
          <Image
            src="/google.png"
            alt="Google Logo"
            width={22}
            height={22}
            className="object-contain"
          />
          <span>Continue with Google</span>
        </button>

      </div>
    </div>
  );
}