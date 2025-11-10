"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Form = { code: string };

export default function VerifyForgotPassword() {
  const [, navigate] = useLocation();
  const { forgotPassword, verifyForgotCode } = useAuth();
  const qs = useMemo(() => new URLSearchParams(window.location.search), []);
  const email = qs.get("email") || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ mode: "onChange" });

  const [serverError, setServerError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const onConfirm = handleSubmit(async ({ code }) => {
    setPending(true);
    setServerError(null);
    try {
      if (!code || code.trim().length < 6) {
        setServerError("Please enter a valid 6-digit code");
        setPending(false);
        return;
      }

      // Verify the code is valid before proceeding
      // This checks if the code is correct without consuming it
      // (it uses a dummy password - if code is valid, we get InvalidPasswordException)
      const isValid = await verifyForgotCode(email, code.trim());
      
      if (!isValid) {
        setServerError("Invalid or expired verification code. Please check or request a new one.");
        setPending(false);
        return;
      }

      // Code is valid, navigate to create new password page
      navigate(
        `/create-new-password?email=${encodeURIComponent(
          email
        )}&code=${encodeURIComponent(code.trim())}`
      );
    } catch (err: any) {
      setServerError(err.message || "Verification failed");
      setPending(false);
    } finally {
      setPending(false);
    }
  });

  const onResend = async () => {
    try {
      setServerError(null);
      await forgotPassword(email);
      setSecondsLeft(90);
    } catch (err: any) {
      setServerError(err.message || "Failed to resend code");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#E7E4EC] px-4">
      <div className="bg-white p-6 border border-[#CCD8D3] rounded-[20px] w-full max-w-[460px]">
        <form onSubmit={onConfirm}>
          <h1 className="text-center text-[#8C5AF2] text-[26px] font-display">
            Verify Code
          </h1>
          <p className="text-[#BBB0CF] text-[14px] text-center mt-2">
            Enter the verification code sent to your email
          </p>

          <div className="mt-[25px]">
            <label className="text-[16px] text-[#999999] font-story">
              Code
            </label>
            <Input
              placeholder="Enter verification code"
              {...register("code", { required: "Code is required" })}
              className="bg-[#F8F8F8] h-[43px] border border-[#BABABA] placeholder:text-[#999999] mt-1"
            />
            {errors.code && (
              <p className="text-red-500 text-sm mt-1">
                {errors.code.message}
              </p>
            )}
            {serverError && (
              <p className="text-red-500 text-sm mt-1">{serverError}</p>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="w-full bg-[#8C5AF2] text-white mt-[25px]"
            >
              {pending ? "Verifying..." : "Verify Code"}
            </Button>

            <div className="mt-3 text-center text-sm text-[#888]">
              Didn’t receive a code?{" "}
              <button
                type="button"
                onClick={onResend}
                disabled={secondsLeft > 0}
                className="text-[#8C5AF2] hover:underline"
              >
                {secondsLeft > 0
                  ? `Resend in ${secondsLeft}s`
                  : "Resend Code"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
