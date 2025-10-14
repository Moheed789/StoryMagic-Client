import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchAuthSession } from "aws-amplify/auth";

export default function Subscription() {
  const { user, getUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const subscriptionStatus = user?.apiProfile?.subscriptionStatus === "premium";
  const handleUpgradeToPro = async () => {
    try {
      setLoading(true);
      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();

      if (!token) {
        alert("Please login first");
        setLoading(false);
        return;
      }

      const response = await fetch(
        "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/stripe/checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Checkout failed");

      const checkoutUrl =
        data.url ||
        data.sessionUrl ||
        data.checkout_url ||
        data.checkoutUrl ||
        data.session?.url;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        alert("Checkout URL not found");
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelLoading(true);

      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();

      if (!token) {
        alert("Please login first");
        setCancelLoading(false);
        return;
      }

      const response = await fetch(
        "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/cancel-plan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Cancel failed");

      alert("Subscription canceled successfully!");
      await getUserProfile();
    } catch (error: any) {
      alert(`Failed to cancel: ${error.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F6FA] text-slate-900">
      <header className="py-10">
        <h1 className="text-center text-[64px] font-[400] text-[#24212C] font-display">
          Pricing Plans
        </h1>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <section className="rounded-[16px] bg-white shadow-sm ring-1 ring-slate-100">
          <div className="p-[42px] sm:p-8">
            <h2 className="text-[32px] font-[400] text-[#8C5AF2] font-display">
              Choose your Plan
            </h2>

            <div className="mt-[50px] grid grid-cols-1 gap-6 md:grid-cols-2">
              <article className="bg-[#E7E4EC] border border-[#C3C3C3] py-[36px] px-[30px] rounded-[20px]">
                <p className="text-[26px] text-[#000000] font-display">
                  Free Plan
                </p>

                <div className="mt-3 flex items-end gap-2">
                  <div className="text-4xl font-extrabold tracking-tight text-[#8C5AF2]">
                    $0.00
                  </div>
                  <div className="pb-1 text-slate-500">/month</div>
                </div>

                <p className="mt-1 text-[13px] text-slate-500">
                  Start creating — no credit card needed.
                </p>

                <div className="mt-5">
                  <p className="text-[22px] text-[#000000] font-sans font-[700]">
                    Highlights
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>1 story every 15 minutes</li>
                    <li>2 stories per day (per IP)</li>
                    <li>AI story generation & preview</li>
                    <li>Standard PDF download</li>
                    <li>Basic support</li>
                  </ul>
                </div>

                <div className="mt-[75px] flex justify-center">
                  <div className="flex items-center gap-2 rounded-lg  px-4 py-2">
                    <span className="h-2 w-2 rounded-full bg-[#8C5AF2]"></span>
                    <span className="text-[#8C5AF2] font-semibold text-sm">
                      Current Plan (Activated)
                    </span>
                  </div>
                </div>
              </article>

              <article className="bg-gradient-to-br from-[#8C5AF2] to-[#F5C73D] border border-[#C3C3C3] py-[36px] px-[30px] rounded-[20px] text-white">
                <p className="text-[26px] font-display">Pro Plan</p>

                <div className="mt-3 flex items-end gap-2">
                  <div className="text-4xl font-extrabold tracking-tight">
                    $9.00
                  </div>
                  <div className="pb-1 text-white/80">/month</div>
                </div>

                <p className="mt-1 text-[13px] text-white/80">
                  Unlock unlimited story generation & premium features.
                </p>

                <div className="mt-5">
                  <p className="text-[22px] font-sans font-[700]">Highlights</p>
                  <ul className="mt-3 space-y-2 text-sm text-white/90">
                    <li>Unlimited stories</li>
                    <li>Priority generation queue</li>
                    <li>Premium PDF (print-ready)</li>
                    <li>Saved prompts & favorites</li>
                    <li>Email support</li>
                  </ul>
                </div>

                <div className="mt-[75px]">
                  <button
                    onClick={!loading ? handleUpgradeToPro : undefined}
                    disabled={loading || subscriptionStatus}
                    className={`w-full rounded-lg h-[43px] bg-white text-[#8C5AF2] px-4 py-2 text-sm font-semibold transition active:scale-[.98]
                      ${
                        loading || subscriptionStatus
                          ? "opacity-50 cursor-not-allowed bg-white/80"
                          : "hover:bg-white/90"
                      }`}
                  >
                    {loading ? "Redirecting to Checkout..." : "Upgrade to Pro"}
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
