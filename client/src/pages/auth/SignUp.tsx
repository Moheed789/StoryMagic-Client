"use client";
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { readableAuthError } from "@/lib/utils";
import EmailVerificationCard from "./EmailVerification";
import { useAuth } from "@/context/AuthContext";

const signUpSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters, 1 uppercase, 1 special character")
    .regex(/[A-Z]/, "Include at least 1 uppercase letter")
    .regex(
      /[!@#$%^&*()[\]{};:'",.<>/?\\|`~_\-+=]/,
      "Include at least 1 special character"
    ),
  agree: z.literal(true, {
    errorMap: () => ({
      message: "You must agree to the Terms & Conditions",
    }),
  }),
});
type SignUpForm = z.infer<typeof signUpSchema>;

const verifySchema = z.object({
  code: z.string().min(6, "Enter the 6-digit code"),
});
type VerifyForm = z.infer<typeof verifySchema>;

const SignUp: React.FC = () => {
  const [, navigate] = useLocation();
  const {signUpUser,confirmUserSignUp,resendSignUpUser,signInUser,step,setStep,} = useAuth();
  const [showPass, setShowPass] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const RESEND_SECONDS = 60;
  const [secondsLeft, setSecondsLeft] = React.useState(RESEND_SECONDS);

  const {register,handleSubmit,formState: { errors, isValid },getValues,} = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: { fullName: "", email: "", password: "", agree: false },
  });

  const {
    register: registerVerify,
    handleSubmit: handleVerifySubmit,
    formState: { errors: verifyErrors, isValid: verifyValid },
    reset: resetVerify,
    trigger,
  } = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    mode: "onChange",
    defaultValues: { code: "" },
  });

  const onSubmitSignUp = async (data: SignUpForm) => {
    setServerError(null);
    setPending(true);
    try {
      const res = await signUpUser(data.email, data.password, data.fullName);
      if (res?.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setStep("verify");
      } else {
        setStep("success");
      }
    } catch (err: any) {
      setServerError(readableAuthError(err));
    } finally {
      setPending(false);
    }
  };

  const onSubmitVerify = async ({ code }: VerifyForm) => {
    setServerError(null);
    setPending(true);
    const email = getValues("email");
    const password = getValues("password");
    try {
      await confirmUserSignUp(email, code, password);
      setStep("success");
      resetVerify({ code: "" });
    } catch (err: any) {
      setServerError(readableAuthError(err));
    } finally {
      setPending(false);
    }
  };

  const resend = async () => {
    if (secondsLeft > 0) return;
    setServerError(null);
    try {
      const email = getValues("email");
      const password = getValues("password");
      const fullName = getValues("fullName");
      await resendSignUpUser(email, password, fullName);
      setSecondsLeft(RESEND_SECONDS);
    } catch (err: any) {
      setServerError(readableAuthError(err));
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#E7E4EC] flex items-center justify-center p-4">
      <div className="w-full max-w-[500px]">
        {step === "form" && (
          <div className="bg-white rounded-[20px] border border-[#CCD8D3] shadow-sm pt-[24px] pb-[43px] px-[30px] sm:px-[51px]">
            <h1 className="text-[26px] sm:text-[36px] text-[#8C5AF2] font-display text-center">
              Register Your Account
            </h1>

            <form
              onSubmit={handleSubmit(onSubmitSignUp as any)}
              className="mt-4 space-y-3"
            >
              <div className="space-y-1">
                <label className="text-[16px] text-[#999999] font-story">
                  Full Name
                </label>
                <Input
                  placeholder="Enter Full Name"
                  className="bg-[#F8F8F8] h-[43px] border border-[#BABABA] placeholder:text-[#999999]"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[16px] text-[#999999] font-story">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter Email"
                  className="bg-[#F8F8F8] h-[43px] border border-[#BABABA] placeholder:text-[#999999]"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-[12px] text-[#BAA2E5]">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[16px] text-[#999999] font-story">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="Create Password"
                    className="bg-[#F8F8F8] h-[43px] border border-[#BABABA] placeholder:text-[#999999]"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute inset-y-0 right-2 grid place-items-center text-[#999999] hover:opacity-80"
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[12px] text-[#BAA2E5] mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-[12px] mt-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-[#6b3df0]"
                  {...register("agree")}
                />
                <span className="text-[#999999] font-sans text-[14px]">
                  Agree to our{" "}
                  <Link
                    href="#"
                    className="underline text-[#8C5AF2] font-[600]"
                  >
                    Terms &amp; Conditions
                  </Link>
                </span>
              </label>
              {errors.agree && (
                <p className="text-xs text-red-500">{errors.agree.message}</p>
              )}

              {serverError && (
                <p className="text-sm text-red-500">{serverError}</p>
              )}

              <Button
                type="submit"
                disabled={!isValid || pending}
                onClick={() => trigger()}
                className="w-full h-[44px] mt-2 bg-gradient-to-r from-[#7b45ff] to-[#6b3df0] text-white font-story text-[18px]"
              >
                {pending ? "Creating account..." : "Register"}
              </Button>

              <p className="text-center text-[14px] text-[#8E8E93] mt-3 font-sans">
                Already have an account?{" "}
                <Link href="/signin" className="text-[#8C5AF2] font-[600]">
                  Sign In
                </Link>
              </p>
            </form>
          </div>
        )}

        {step === "verify" && (
          <EmailVerificationCard
            secondsLeft={secondsLeft}
            serverError={serverError}
            registerCode={registerVerify("code")}
            codeError={verifyErrors.code?.message}
            pending={pending || !verifyValid}
            onConfirm={handleVerifySubmit(onSubmitVerify)}
            onResend={resend}
          />
        )}
      </div>
    </div>
  );
};

export default SignUp;
