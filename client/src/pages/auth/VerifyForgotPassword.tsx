"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import EmailVerificationCard from "./EmailVerification";

type Form = { code: string };

export default function VerifyForgotPassword() {
  const [, navigate] = useLocation();
  const { forgotPassword } = useAuth();
  const qs = useMemo(() => new URLSearchParams(window.location.search), []);
  const email = qs.get("email") || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ mode: "onChange" });

  const [serverError, setServerError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const onConfirm = handleSubmit(({ code }) => {
    navigate(
      `/create-new-password?email=${encodeURIComponent(
        email
      )}&code=${encodeURIComponent(code)}`
    );
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
      <EmailVerificationCard
        secondsLeft={secondsLeft}
        serverError={serverError}
        registerCode={register("code", { required: "Code is required" })}
        codeError={errors.code?.message}
        onConfirm={onConfirm}
        onResend={onResend}
        pending={pending}
      />
    </div>
  );
}
