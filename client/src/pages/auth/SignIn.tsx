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
import { useAuth } from "@/context/AuthContext";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional().default(false),
});
type SignInForm = z.infer<typeof signInSchema>;

const SignIn: React.FC = () => {
  const { signInUser } = useAuth();
  const [, navigate] = useLocation();
  const [showPass, setShowPass] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,   
    formState: { errors, isValid },
    getValues,
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (data: SignInForm) => {
    setServerError(null);
    setPending(true);
    try {
      const res = await signInUser(data.email, data.password);
      const step = res?.nextStep?.signInStep;

      if (!step || step === "DONE") {
        navigate("/");
        return;
      }

      if (step === "CONFIRM_SIGN_UP") {
        navigate(
          `/SignUp?step=verify&email=${encodeURIComponent(getValues("email"))}`
        );
        return;
      }

      if (step === "CONFIRM_SIGN_IN_WITH_SMS_CODE") {
        navigate(
          `/mfa?type=sms&email=${encodeURIComponent(getValues("email"))}`
        );
        return;
      }

      if (step === "CONFIRM_SIGN_IN_WITH_TOTP_CODE") {
        navigate(
          `/mfa?type=totp&email=${encodeURIComponent(getValues("email"))}`
        );
        return;
      }

      if (
        step === "RESET_PASSWORD" ||
        step === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD"
      ) {
        navigate(
          `/forgot-password?email=${encodeURIComponent(getValues("email"))}`
        );
        return;
      }

      setServerError(
        "Additional verification is required. Please continue the flow."
      );
    } catch (err: any) {
      const msg = readableAuthError(err);
      if (msg.toLowerCase().includes("not confirmed")) {
        navigate(
          `/SignUp?step=verify&email=${encodeURIComponent(getValues("email"))}`
        );
      } else {
        setServerError(msg);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#E7E4EC] flex items-center justify-center p-4">
      <div className="w-full max-w-[500px] bg-white rounded-[20px] border border-[#CCD8D3] px-[50.5px] pt-[37px] pb-[54px]">
        <h1 className="text-[36px] text-[#8C5AF2] font-display text-center">
          Welcome Back!
        </h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-3 mt-[18px]">
            <div className="space-y-1">
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
              <label
                htmlFor="password"
                className="text-[16px] text-[#999999] font-story"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Enter Password"
                  className="bg-[#F8F8F8] h-[43px] border border-[#BABABA] placeholder:text-[#999999]"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute inset-y-0 right-2 grid place-items-center text-[#999999] hover:opacity-80"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={21} /> : <Eye size={21} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[12px] text-[#BAA2E5]">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-[16px] flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-[14px] text-[#8E8E93]">
              <input
                type="checkbox"
                className="h-[16px] w-[16px] rounded border border-[#BABABA] accent-[#8C5AF2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5AF2]/40"
                {...register("remember")}
              />
              Remember me
            </label>

            <Link
              href="/forgot-password"
              className="text-[#8C5AF2] text-[14px] font-medium hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {serverError && (
            <p className="text-sm text-red-500 mt-2">{serverError}</p>
          )}

          <Button
            type="submit"
            disabled={!isValid || pending}
            className="w-full text-[18px] font-story h-[46px] mt-[20px] bg-gradient-to-r from-[#7b45ff] to-[#6b3df0] text-white border-0 hover:opacity-95 disabled:opacity-60"
          >
            {pending ? "Signing in..." : "Sign In"}
          </Button>

          <p className="text-center text-[14px] text-[#8E8E93] mt-[18px] font-sans">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[#8C5AF2] font-[600]">
              Register Now
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
