"use client";
import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";

export default function CreateNewPassword() {
  const { confirmForgotPassword, forgotPassword, setStep } = useAuth();
  const [, navigate] = useLocation();
  const qs = useMemo(() => new URLSearchParams(window.location.search), []);
  const email = qs.get("email") || "";
  const codeFromQs = qs.get("code") || "";

  const [code, setCode] = useState(codeFromQs);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // resend cooldown + small success message
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const onCodeChange = (val: string) => {
    const digits = (val || "").replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (error) setError(null);
  };

  const onResend = async () => {
    setError(null);
    setInfoMsg(null);
    if (!email) {
      setError("Email is missing. Please restart the reset flow.");
      return;
    }
    try {
      await forgotPassword(email);
      setSecondsLeft(60); 
      setInfoMsg("A new code has been sent to your email.");
    } catch (e: any) {
      setError(e?.message || "Failed to resend code");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);

    if (!email) {
      setError("Email is missing. Please restart the reset flow.");
      return;
    }
    if (!code || code.trim().length !== 6) {
      setError("Enter a valid 6-digit verification code");
      return;
    }
    if (!password) return setError("Password is required");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (!/[A-Z]/.test(password)) return setError("Password must include at least 1 uppercase letter");
    if (!/[!@#$%^&*()[\]{};:'\",.<>/?\\|`~_+=-]/.test(password))
      return setError("Password must include at least 1 special character");
    if (password !== confirm) return setError("Passwords do not match");

    try {
      setPending(true);
      await confirmForgotPassword(email, code.trim(), password);
      setStep("forgetsuccess");
      navigate("/signin?passwordReset=true");
    } catch (err: any) {
      if (err?.name === "CodeMismatchException") {
        setError("Invalid verification code. Please check or request a new one.");
      } else if (err?.name === "ExpiredCodeException") {
        setError("This code has expired. Please request a new code.");
      } else if (err?.name === "InvalidPasswordException" || `${err?.message}`.includes("Password did not conform")) {
        setError("Password does not meet the policy. Use a stronger password.");
      } else {
        setError(err?.message || "Failed to reset password");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#E7E4EC]">
      <div className="bg-white pt-[29px] pb-[42px] px-[50px] border border-[#CCD8D3] w-full max-w-[500px] rounded-[20px] shadow-sm">
        <form onSubmit={onSubmit}>
          <h1 className="text-center text-[#8C5AF2] text-[26px] sm:text-[28px] font-display">
            Create New Password
          </h1>
          <p className="mt-[10px] text-[#BBB0CF] text-[14px] font-sans text-center">
            Enter the verification code and your new password
          </p>

          {/* Verification Code */}
          <div className="mt-[25px]">
            <label className="text-[16px] text-[#999999] font-story">Verification Code</label>
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              className="bg-[#F8F8F8] h-[43px] border border-[#BABABA] placeholder:text-[#999999] mt-1"
            />

            <div className="mt-2 text-sm text-[#888]">
              Didn’t receive a code?{" "}
              <button
                type="button"
                onClick={onResend}
                disabled={secondsLeft > 0 || pending}
                className="text-[#8C5AF2]"
              >
                {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend Code"}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="mt-[20px]">
            <label className="text-[16px] text-[#999999] font-story">New Password</label>
            <div className="relative mt-1">
              <Input
                type={showPass ? "text" : "password"}
                placeholder="Enter Your Password Here"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
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

          {/* Confirm Password */}
          <div className="mt-[24px]">
            <label className="text-[16px] text-[#999999] font-story">Confirm Password</label>
            <div className="relative mt-1">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter Your Password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (error) setError(null);
                }}
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

          {/* Messages */}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {infoMsg && <p className="text-green-600 text-sm mt-2">{infoMsg}</p>}

          <Button
            type="submit"
            disabled={pending}
            className="w-full bg-[#8C5AF2] text-white mt-[30px] h-[44px]"
          >
            {pending ? "Saving..." : "Submit"}
          </Button>
        </form>
      </div>
    </div>
  );
}
