"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface EmailVerificationCardProps {
  secondsLeft: number;
  serverError?: string | null;
  registerCode: ReturnType<any>;
  codeError?: string;
  onConfirm: (e: React.FormEvent) => void;
  onResend: () => void;
  pending?: boolean;
}

export default function EmailVerificationCard({
  secondsLeft,
  serverError,
  registerCode,
  codeError,
  onConfirm,
  onResend,
  pending,
}: EmailVerificationCardProps) {
  return (
    <div className="bg-white w-full max-w-[560px] rounded-[20px] border border-[#CCD8D3] shadow-sm px-[30px] sm:px-[77px] py-[49px]">
      <div className="text-center">
        <h1 className="text-[26px] sm:text-[32px] text-[#8C5AF2] font-display text-center">
          Email Verification
        </h1>
        <p className="text-[18px] font-sans text-[#B7ABCC] font-[500]">
          Check your inbox for the verification code.
        </p>
      </div>

      <form onSubmit={onConfirm} className="mt-[22px]">
        <div className="space-y-1">
          <label className="text-[16px] text-[#999999] font-story">
            Verification code
          </label>
          <div className="sm:flex gap-1 items-center">
            <Input
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              className="bg-[#F8F8F8] h-[43px] border border-[#BABABA] placeholder:text-[#999999]"
              {...registerCode}
            />
            <Button
              type="submit"
              disabled={pending}
              className="mt-2 sm:mt-0 h-[36px] px-5 bg-gradient-to-r from-[#7b45ff] to-[#6b3df0] text-white w-[124px]"
            >
              {pending ? "Confirming..." : "Confirm"}
            </Button>
          </div>
        </div>

        {serverError && (
          <p className="text-sm text-red-500 mt-2">{serverError}</p>
        )}
        <div className=" mt-[34px]">
          <p className="text-[14px] text-[#8DA99E] font-sans text-center">
            If you do not receive the email use the Button below to resend
            verification code
          </p>
          <div className="mt-[16px] flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={onResend}
              disabled={secondsLeft > 0}
              className={`text-sm underline ${
                secondsLeft > 0
                  ? "text-[#bbb] cursor-not-allowed"
                  : "text-[#8C5AF2] hover:opacity-90"
              }`}
            >
              Resend
            </button>
            <p className="text-center font-mono text-[14px] text-[#8DA99E]">
              {secondsLeft > 0
                ? `0:${String(secondsLeft).padStart(2, "0")}`
                : "You can resend now"}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
