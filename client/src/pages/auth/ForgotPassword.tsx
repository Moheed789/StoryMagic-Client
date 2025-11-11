"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await forgotPassword(email);
      navigate(`/create-new-password?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#E7E4EC] p-4">
      <div className="bg-white py-[42px] px-[30px] sm:px-[77px] border border-[#CCD8D3] w-full max-w-[560px] rounded-[20px]">
        <form onSubmit={onSubmit}>
          <h1 className="text-center text-[#8C5AF2] text-[24px] sm:text-[28px] font-display">
            Forgot Your Password?
          </h1>
          <p className="mt-[14px] text-[#BBB0CF] text-[14px] font-sans text-center">
            Enter your email and we’ll send you a verification code.
          </p>

          <div className="mt-[22px]">
            <label
              htmlFor="email"
              className="text-[16px] text-[#999999] font-story"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#F8F8F8] h-[43px] border border-[#BABABA] placeholder:text-[#999999] mt-1"
              required
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

            <Button
              type="submit"
              disabled={!email || pending}
              className="w-full bg-[#8C5AF2] text-white mt-[29px]"
            >
              {pending ? "Sending..." : "Get Code"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
