"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import * as React from "react";
type Step = string | null;

interface RegistrationSuccessModalProps {
  onOk: () => void;
}

export default function RegistrationSuccessModal({
  onOk,
}: RegistrationSuccessModalProps) {
  const { step, setStep } = useAuth();

  if (step !== "success" && step !== "forgetsuccess") {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute " />
      <div className="relative bg-white w-full max-w-[560px] rounded-[20px] border border-[#CCD8D3] shadow-lg py-[45px] px-6">
        <div className="w-full max-w-[405px] mx-auto">
          <h1 className="text-[26px] text-[#8C5AF2] font-display text-center">
            {step === "forgetsuccess"
              ? "Password Reset Successfully!"
              : "Registration Successful!"}
          </h1>
          <p className="text-[14px] text-[#BBB0CF] text-center mt-3">
            {step === "forgetsuccess"
              ? "Your Password has been successfully updated. you can now sign in using your new password."
              : "Congratulations! you are successfully registered to Story Magic"}
          </p>
          <Button
            className="w-full bg-gradient-to-r from-[#7b45ff] to-[#6b3df0] text-white mt-[31px]"
            onClick={() => setStep("form")}
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
