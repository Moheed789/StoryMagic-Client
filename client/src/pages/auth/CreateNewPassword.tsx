"use client";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";

export default function CreateNewPassword() {
  const { confirmForgotPassword } = useAuth();
  const [, navigate] = useLocation();

  const qs = useMemo(() => new URLSearchParams(window.location.search), []);
  const email = qs.get("email") || "";
  const code = qs.get("code") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { setStep } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) return setError("Password is required");
    if (password.length < 8)
      return setError("Password must be at least 8 characters");
    if (!/[A-Z]/.test(password))
      return setError("Password must include at least 1 uppercase letter");
    if (!/[!@#$%^&*()[\]{};:'\",.<>/?\\|`~_+=]/.test(password))
      return setError("Password must include at least 1 special character");
    if (password !== confirm) return setError("Passwords do not match");

    try {
      setPending(true);
      await confirmForgotPassword(email, code, password);
      navigate("/signin");
      setStep("forgetsuccess");
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-[#E7E4EC]">
        <div className="bg-white pt-[29px] pb-[42px] px-[50px] border border-[#CCD8D3] w-full max-w-[500px] rounded-[20px] shadow-sm">
          <form onSubmit={onSubmit}>
            <h1 className="text-center text-[#8C5AF2] text-[26px] sm:text-[28px] font-display">
              Create New Password
            </h1>
            <p className="mt-[10px] text-[#BBB0CF] text-[14px] font-sans text-center">
              Enter and confirm your new password below
            </p>

            <div className="mt-[25px]">
              <div>
                <label className="text-[16px] text-[#999999] font-story">
                  New Password
                </label>
                <div className="relative mt-1">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="Enter Your Password Here"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#F8F8F8] h-[43px] border border-[#BABABA] placeholder:text-[#999999]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute inset-y-0 right-2 grid place-items-center text-[#999999] hover:opacity-80"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[12px] text-[#BAA2E5] mt-1">
                  At least 8 characters, 1 uppercase, 1 special character
                </p>
              </div>

              <div className="mt-[24px]">
                <label className="text-[16px] text-[#999999] font-story">
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter Your Password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="bg-[#F8F8F8] h-[43px] border border-[#BABABA] placeholder:text-[#999999]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute inset-y-0 right-2 grid place-items-center text-[#999999] hover:opacity-80"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              <Button
                type="submit"
                disabled={pending}
                className="w-full bg-[#8C5AF2] text-white mt-[30px] h-[44px]"
              >
                {pending ? "Saving..." : "Submit"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
