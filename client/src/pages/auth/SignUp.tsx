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
import Modal from "@/components/Modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const signUpSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters, 1 uppercase, 1 special character, 1 number")
    .regex(/[A-Z]/, "Include at least 1 uppercase letter")
    .regex(/[0-9]/, "Include at least 1 number")
    .regex(
      /[-!@#$%^&*()[\]{};:'",.<>/?\\|`~_+=]/,
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
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const {
    signUpUser,
    confirmUserSignUp,
    confirmSignUpOnly,
    resendSignUpUser,
    step,
    setStep,
  } = useAuth();

  const [showPass, setShowPass] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showTerms, setShowTerms] = React.useState(false);

  const RESEND_SECONDS = 180;
  const [secondsLeft, setSecondsLeft] = React.useState(RESEND_SECONDS);
  const countdownRef = React.useRef<NodeJS.Timeout | null>(null);
  React.useEffect(() => {
    if (secondsLeft > 0 && !countdownRef.current) {
      countdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            countdownRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [secondsLeft]);

  const startCountdown = (start = RESEND_SECONDS) => setSecondsLeft(start);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
    trigger,
    setValue,
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      agree: false as any,
    },
  });

  const {
    register: registerVerify,
    handleSubmit: handleVerifySubmit,
    formState: { errors: verifyErrors, isValid: verifyValid },
    reset: resetVerify,
  } = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    mode: "onChange",
    defaultValues: { code: "" },
  });

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get("step");
    if (!stepParam) {
      setStep("form");
    }
  }, [setStep]);
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get("step");
    const emailParam = params.get("email");

    if (stepParam === "verify") {
      setStep("verify");

      const formEmail = getValues("email");
      if (!formEmail && emailParam) {
        setValue("email", emailParam, { shouldValidate: true });
      }

      setSecondsLeft(0);
    }
  }, [location, setStep, getValues, setValue]);

  const handleManualResend = async () => {
    if (secondsLeft > 0) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const emailFromUrl = params.get("email") || "";
      const email = (getValues("email") || emailFromUrl || "").trim();

      if (!email) {
        setServerError("Email is required to resend verification code");
        return;
      }

      await resendSignUpUser(email);
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      setServerError(readableAuthError(err));
    }
  };

  const onSubmitSignUp = async (data: SignUpForm) => {
    setServerError(null);
    setPending(true);
    try {
      const res = await signUpUser(data.email, data.password, data.fullName);
      if (res?.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setStep("verify");
        startCountdown(RESEND_SECONDS);
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

    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get("email");
    const email = (getValues("email") || urlEmail || "").trim();
    const password = getValues("password");

    if (!email) {
      setServerError("Email is required");
      setPending(false);
      return;
    }

    if (!code || code.length < 6) {
      setServerError("Please enter a valid 6-digit code");
      setPending(false);
      return;
    }

    try {
      if (password) {
        await confirmUserSignUp(email, code, password);
        setStep("success");
      } else {
        await confirmSignUpOnly(email, code);
        navigate(`/signin?verified=true&email=${encodeURIComponent(email)}`);
        return;
      }
      resetVerify({ code: "" });
    } catch (err: any) {
      setServerError(readableAuthError(err));
      setPending(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        title="Terms & Conditions"
        maxWidth="w-full sm:max-w-[700px]"
        className="px-0"
      >
        <div className="px-3 sm:px-6 pb-6 pt-3">
          <Card className="bg-[#F8F5FF] border border-[#E0D6FF] shadow-sm rounded-2xl">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle
                data-testid="heading-terms"
                className="text-2xl sm:text-3xl font-display text-[#292742]"
              >
                Terms of Service
              </CardTitle>
              <p
                data-testid="text-last-updated"
                className="text-xs sm:text-sm text-muted-foreground"
              >
                Last Updated: November 5, 2025
              </p>
            </CardHeader>

            <CardContent className="space-y-5 sm:space-y-6 font-story text-sm sm:text-[15px] leading-relaxed text-[#4B4B5A]">
              <div className="text-muted-foreground space-y-4">
                <p data-testid="text-welcome">
                  Welcome to StoryBloom.ai (&quot;StoryBloom,&quot;
                  &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). These
                  Terms of Service (&quot;Terms&quot;) govern your access to and
                  use of our website, mobile applications, and related products
                  and services (collectively, the &quot;Services&quot;).
                </p>
                <p data-testid="text-agreement">
                  By accessing or using StoryBloom.ai, you agree to these Terms.
                  If you do not agree, please do not use our Services.
                </p>
              </div>

              <section>
                <h2
                  data-testid="heading-overview"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  1. Overview of Our Services
                </h2>
                <p
                  data-testid="text-overview"
                  className="text-muted-foreground"
                >
                  StoryBloom.ai is an AI-powered creative platform that allows
                  users to generate personalized stories, illustrations, and
                  printed storybooks using artificial intelligence. The Services
                  may include interactive story creation, AI-generated imagery,
                  downloadable digital content, and made-to-order printed books.
                </p>
              </section>

              <section>
                <h2
                  data-testid="heading-eligibility"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  2. Eligibility
                </h2>
                <div className="text-muted-foreground space-y-2">
                  <p data-testid="text-eligibility-age">
                    You must be at least 13 years old (or the minimum age of
                    digital consent in your jurisdiction) to use our Services.
                  </p>
                  <p data-testid="text-eligibility-minor">
                    If you are under 18, you may only use StoryBloom.ai under
                    the supervision of a parent or guardian who agrees to these
                    Terms.
                  </p>
                </div>
              </section>

              <section>
                <h2
                  data-testid="heading-accounts"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  3. Accounts and Security
                </h2>
                <p className="text-muted-foreground mb-2">
                  You may need to create an account to access certain features.
                  You agree to:
                </p>
                <ul
                  data-testid="list-account-requirements"
                  className="list-disc list-inside text-muted-foreground space-y-1 ml-4"
                >
                  <li>Provide accurate and complete information.</li>
                  <li>Keep your login credentials secure.</li>
                  <li>
                    Notify us immediately if you suspect unauthorized access to
                    your account.
                  </li>
                </ul>
                <p
                  data-testid="text-account-responsibility"
                  className="text-muted-foreground mt-2"
                >
                  You are responsible for all activity that occurs under your
                  account.
                </p>
              </section>

              <section>
                <h2
                  data-testid="heading-user-content"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  4. User Content &amp; AI-Generated Content
                </h2>

                <h3 className="text-sm sm:text-[15px] font-semibold mb-2 mt-3">
                  (a) Your Input
                </h3>
                <div className="text-muted-foreground space-y-2">
                  <p data-testid="text-user-input">
                    You may submit text, prompts, images, or other materials
                    (&quot;User Input&quot;) to generate stories or
                    illustrations. You retain ownership of your User Input.
                  </p>
                </div>

                <h3 className="text-sm sm:text-[15px] font-semibold mb-2 mt-4">
                  (b) AI-Generated Output
                </h3>
                <div className="text-muted-foreground space-y-2">
                  <p data-testid="text-ai-output">
                    Our AI models use your input to generate creative works
                    (&quot;Output&quot;). StoryBloom.ai does not claim ownership
                    of your Output. However, by using our Services, you grant us
                    a non-exclusive, worldwide, royalty-free license to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      Display, host, and reproduce your Output as needed to
                      operate the Services.
                    </li>
                    <li>
                      Use anonymized examples of generated content for product
                      improvement, marketing, and training purposes (unless you
                      opt out by emailing support@storybloom.ai).
                    </li>
                  </ul>
                  <p
                    data-testid="text-content-responsibility"
                    className="text-muted-foreground"
                  >
                    You are responsible for reviewing and approving all
                    generated content prior to sharing, publishing, or
                    purchasing.
                  </p>
                  <p
                    data-testid="text-preview-acknowledgment"
                    className="text-muted-foreground"
                  >
                    StoryBloom.ai provides previews of stories and images before
                    checkout. By completing a purchase (digital or printed), you
                    acknowledge that you have reviewed the story, text, and
                    images and that they meet your satisfaction and quality
                    standards. If you are not satisfied with the preview, it is
                    your responsibility to make edits or choose not to proceed
                    with the purchase.
                  </p>
                  <p
                    data-testid="text-final-sales"
                    className="text-muted-foreground"
                  >
                    Because AI-generated content is user-directed and variable,
                    all sales are final once a digital download or print order
                    is placed.
                  </p>
                  <p className="text-muted-foreground">
                    You are also responsible for reviewing all generated content
                    for accuracy, appropriateness, and suitability before
                    distributing or sharing it publicly.
                  </p>
                </div>
              </section>

              <section>
                <h2
                  data-testid="heading-ip-rights"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  5. Intellectual Property Rights
                </h2>
                <div className="text-muted-foreground space-y-2">
                  <p data-testid="text-ip-ownership">
                    All trademarks, logos, software, code, and content not
                    created by users or AI generation are the property of
                    StoryBloom.ai or its licensors.
                  </p>
                  <p data-testid="text-ip-restrictions">
                    You may not reproduce, distribute, modify, or create
                    derivative works from any part of our Services except as
                    expressly permitted in these Terms.
                  </p>
                </div>
              </section>

              <section>
                <h2
                  data-testid="heading-restrictions"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  6. Use Restrictions
                </h2>
                <p className="text-muted-foreground mb-2">You agree not to:</p>
                <ul
                  data-testid="list-restrictions"
                  className="list-disc list-inside text-muted-foreground space-y-1 ml-4"
                >
                  <li>
                    Use the Services to generate or share unlawful, harmful,
                    defamatory, or obscene content.
                  </li>
                  <li>
                    Attempt to extract, reverse-engineer, or interfere with the
                    underlying AI models.
                  </li>
                  <li>
                    Present AI-generated content as human-authored without clear
                    disclosure.
                  </li>
                  <li>
                    Misuse the Services to infringe upon the rights of others.
                  </li>
                </ul>
                <p
                  data-testid="text-enforcement"
                  className="text-muted-foreground mt-2"
                >
                  StoryBloom.ai reserves the right to suspend or terminate
                  accounts that violate these rules.
                </p>
              </section>

              <section>
                <h2
                  data-testid="heading-ai-limitations"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  7. AI Limitations and Disclaimers
                </h2>
                <p className="text-muted-foreground mb-2">
                  StoryBloom.ai uses artificial intelligence to generate
                  creative works. You understand and agree that:
                </p>
                <ul
                  data-testid="list-ai-limitations"
                  className="list-disc list-inside text-muted-foreground space-y-1 ml-4"
                >
                  <li>
                    AI outputs may include errors, inaccuracies, or unintended
                    content.
                  </li>
                  <li>
                    Generated content is not guaranteed to be unique or free
                    from similarity to existing works.
                  </li>
                  <li>
                    You are solely responsible for reviewing all story and image
                    previews prior to purchasing, sharing, or publishing.
                  </li>
                  <li>
                    StoryBloom.ai disclaims all liability for dissatisfaction
                    with AI-generated stories, text, or imagery after purchase.
                  </li>
                  <li>
                    You are responsible for ensuring any content you publish or
                    share complies with applicable laws and community standards.
                  </li>
                </ul>
              </section>

              <section>
                <h2
                  data-testid="heading-printed-books"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  8. Printed Books and Orders
                </h2>
                <p className="text-muted-foreground mb-2">
                  If you order a physical book:
                </p>
                <ul
                  data-testid="list-printed-books"
                  className="list-disc list-inside text-muted-foreground space-y-1 ml-4"
                >
                  <li>
                    Prices, taxes, and shipping fees are displayed at checkout.
                  </li>
                  <li>Delivery times are estimates and may vary.</li>
                  <li>
                    Because each book is made-to-order based on AI-generated
                    content, no refunds or reprints will be issued for
                    dissatisfaction related to story content, image quality, or
                    style.
                  </li>
                  <li>
                    You are responsible for verifying that the digital preview
                    meets your expectations before placing an order.
                  </li>
                  <li>
                    We will replace or reprint only in the event of a
                    manufacturing or printing defect (e.g., damaged or missing
                    pages).
                  </li>
                  <li>
                    In test or beta periods, you may be asked to use temporary
                    payment methods or test credit cards.
                  </li>
                </ul>
              </section>

              <section>
                <h2
                  data-testid="heading-privacy"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  9. Privacy
                </h2>
                <div className="text-muted-foreground space-y-2">
                  <p data-testid="text-privacy-policy">
                    Your privacy is important to us. Please review our Privacy
                    Policy to understand how we collect, use, and safeguard
                    information.
                  </p>
                  <p data-testid="text-children-privacy">
                    StoryBloom.ai does not knowingly collect personal data from
                    children under 13. If we learn that we have inadvertently
                    collected such data, we will promptly delete it.
                  </p>
                </div>
              </section>

              <section>
                <h2
                  data-testid="heading-payment"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  10. Payment Terms
                </h2>
                <div className="text-muted-foreground space-y-2">
                  <p data-testid="text-payment-processor">
                    Payments are processed through secure third-party providers
                    (e.g., Stripe). By submitting payment information, you
                    authorize StoryBloom.ai and its payment processor to charge
                    your account for purchases made through the platform.
                  </p>
                  <p data-testid="text-payment-final">
                    All payments are final unless otherwise stated in these
                    Terms.
                  </p>
                </div>
              </section>

              <section>
                <h2
                  data-testid="heading-termination"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  11. Termination
                </h2>
                <div className="text-muted-foreground space-y-2">
                  <p data-testid="text-termination-by-us">
                    We may suspend or terminate access to our Services at any
                    time, with or without notice, for violation of these Terms
                    or to protect our systems and users.
                  </p>
                  <p data-testid="text-termination-by-user">
                    You may also terminate your account at any time by
                    contacting support@storybloom.ai.
                  </p>
                </div>
              </section>

              <section>
                <h2
                  data-testid="heading-indemnification"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  12. Indemnification
                </h2>
                <p
                  data-testid="text-indemnification"
                  className="text-muted-foreground"
                >
                  You agree to indemnify and hold harmless StoryBloom.ai, its
                  affiliates, officers, and employees from any claims,
                  liabilities, or damages arising from your use of the Services,
                  your generated content, or any violation of these Terms.
                </p>
              </section>

              <section>
                <h2
                  data-testid="heading-warranties"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  13. Disclaimer of Warranties
                </h2>
                <div className="text-muted-foreground space-y-2">
                  <p data-testid="text-as-is">
                    Our Services are provided &quot;as is&quot; and &quot;as
                    available.&quot;
                  </p>
                  <p data-testid="text-no-warranties">
                    We make no warranties, express or implied, regarding the
                    accuracy, quality, or reliability of any AI-generated
                    content or the operation of our Services.
                  </p>
                </div>
              </section>

              <section>
                <h2
                  data-testid="heading-liability"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  14. Limitation of Liability
                </h2>
                <p
                  data-testid="text-liability"
                  className="text-muted-foreground"
                >
                  To the fullest extent permitted by law, StoryBloom.ai and its
                  affiliates are not liable for any indirect, incidental,
                  special, consequential, or punitive damages arising from your
                  use of the Services or any AI-generated content, even if we
                  have been advised of the possibility of such damages.
                </p>
              </section>

              <section>
                <h2
                  data-testid="heading-modifications"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  15. Modifications to the Service
                </h2>
                <div className="text-muted-foreground space-y-2">
                  <p data-testid="text-service-modifications">
                    We may modify, update, or discontinue any aspect of the
                    Services at any time without notice.
                  </p>
                  <p data-testid="text-terms-modifications">
                    We may also update these Terms periodically. The updated
                    version will take effect upon posting, and your continued
                    use of the Services constitutes acceptance of the new Terms.
                  </p>
                </div>
              </section>

              <section>
                <h2
                  data-testid="heading-governing-law"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  16. Governing Law
                </h2>
                <div className="text-muted-foreground space-y-2">
                  <p data-testid="text-governing-law">
                    These Terms are governed by the laws of the State of
                    California, without regard to its conflict-of-law
                    principles.
                  </p>
                  <p data-testid="text-dispute-resolution">
                    Any disputes shall be resolved exclusively in the courts
                    located in Los Angeles, California.
                  </p>
                </div>
              </section>

              <section>
                <h2
                  data-testid="heading-contact"
                  className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#292742]"
                >
                  17. Contact Us
                </h2>
                <div className="text-muted-foreground space-y-2">
                  <p data-testid="text-contact-intro">
                    If you have questions about these Terms, please contact us
                    at:
                  </p>
                  <p data-testid="text-contact-email" className="font-semibold">
                    Email: support@storybloom.ai
                  </p>
                  <p
                    data-testid="text-contact-website"
                    className="font-semibold"
                  >
                    Website: www.storybloom.ai
                  </p>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </Modal>

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
                    <p className="text-[12px] text-red-500">
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
                    >
                      {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[12px] text-red-500 mt-1">
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
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="underline text-[#8C5AF2] font-[600]"
                    >
                      Terms & Conditions
                    </button>
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
              isSubmitting={pending}
              onConfirm={handleVerifySubmit(onSubmitVerify)}
              onResend={async () => {
                if (secondsLeft > 0) return;
                try {
                  setPending(true);
                  setServerError(null);

                  const params = new URLSearchParams(window.location.search);
                  const emailFromUrl = params.get("email") || "";
                  const email = (
                    getValues("email") ||
                    emailFromUrl ||
                    ""
                  ).trim();

                  if (!email) {
                    setServerError(
                      "Email is required to resend verification code"
                    );
                    return;
                  }

                  await resendSignUpUser(email);
                  setSecondsLeft(RESEND_SECONDS);
                } catch (err: any) {
                  setServerError(readableAuthError(err));
                } finally {
                  setPending(false);
                }
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default SignUp;
