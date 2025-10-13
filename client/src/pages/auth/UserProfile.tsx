"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { fetchAuthSession } from "aws-amplify/auth"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

const UserProfile = () => {
  const { user, getUserProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const subscriptionStatus = user?.apiProfile?.subscriptionStatus === "premium"

  const getSubscribedDate = () => {
    const profile = user?.apiProfile
    
    const subscriptionDate = 
      profile?.subscriptionStart 

    if (subscriptionDate) {
      const date = typeof subscriptionDate === 'number' 
        ? new Date(subscriptionDate * 1000)
        : new Date(subscriptionDate)
      
      return date
    }

    const accountDate = 
      profile?.createdAt ||
      profile?.created_at ||
      profile?.registrationDate ||
      profile?.accountCreated

    if (accountDate) {
      const date = typeof accountDate === 'number' 
        ? new Date(accountDate * 1000)
        : new Date(accountDate)
      
      return date
    }

    return new Date()
  }

  const subscribedDate = getSubscribedDate()
  const subscribedDateText = subscribedDate.toLocaleDateString('en-US', {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })

  const handleUpgradeToPro = async () => {
    try {
      setLoading(true)
      const session: any = await fetchAuthSession()
      const token = session?.tokens?.idToken?.toString()

      if (!token) {
        alert("Please login first")
        setLoading(false)
        return
      }

      const response = await fetch(
        "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/stripe/checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Checkout failed")

      const checkoutUrl = data.url || data.sessionUrl || data.checkout_url || data.checkoutUrl || data.session?.url

      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        alert("Checkout URL not found")
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      setCancelLoading(true)

      const session: any = await fetchAuthSession()
      const token = session?.tokens?.idToken?.toString()

      if (!token) {
        alert("Please login first")
        setCancelLoading(false)
        return
      }

      const response = await fetch("https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/cancel-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Cancel failed")

      alert("Subscription canceled successfully!")
      await getUserProfile()
    } catch (error: any) {
      alert(`Failed to cancel: ${error.message}`)
    } finally {
      setCancelLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F7F6FA] text-slate-900">
      <header className="py-10">
        <h1 className="text-center text-[64px] font-[400] text-[#24212C] font-display">User Profile</h1>
      </header>

      <main className="mx-auto max-w-[1580px] px-4 pb-16">
        <section className="rounded-[16px] bg-white shadow-sm ring-1 ring-slate-100">
          <div className="border-b border-slate-100 p-6 sm:p-8">
            <h2 className="text-[32px] font-[400] text-[#8C5AF2] font-display">Personal Information</h2>

            <div className="mt-6 grid max-w-lg gap-4">
              <div>
                <label className="mb-1 block text-[16px] font-[400] font-story text-[#999999]">Full Name</label>
                <input
                  type="text"
                  defaultValue={user?.apiProfile?.fullName}
                  className="w-full text-[#BBB0CF] bg-[#F5F5F5] rounded-[8px] h-[43px] px-3 py-2 text-[16px] font-story outline-none focus:border-[#6A4DF5] focus:bg-white focus:ring-2 focus:ring-[#6A4DF5]/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-[16px] font-[400] font-story text-[#999999]">Email</label>
                <input
                  type="email"
                  defaultValue={user?.apiProfile?.email}
                  className="w-full bg-[#F5F5F5] rounded-[8px] text-[#BBB0CF] h-[43px] px-3 py-2 text-[16px] font-story outline-none focus:border-[#6A4DF5] focus:bg-white focus:ring-2 focus:ring-[#6A4DF5]/20"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-lg bg-[#8C5AF2] px-[54px] py-[13px] text-sm font-semibold text-white shadow-sm transition active:scale-[.98] hover:bg-[#825fc7]"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          <div className="p-[42px] sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[32px] font-[400] text-[#8C5AF2] font-display">Subscription Summary</h2>
              {subscriptionStatus && (
                <Button
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                  className="mt-6 bg-red-600 hover:bg-red-700 text-white rounded-lg px-6 py-2 transition active:scale-[.98] disabled:opacity-50"
                >
                  {cancelLoading ? "Canceling..." : "Cancel Subscription"}
                </Button>
              )}
            </div>

            {subscriptionStatus ? (
              <article className="mt-6 rounded-[20px] bg-[#F4F2F7] border border-[#E7E4EC] py-6 px-6">
                {/* top row: status + price */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-[#666] text-sm">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#34C759]" aria-hidden="true" />
                    <span>Active</span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <div className="text-[40px] leading-none font-extrabold tracking-tight text-[#8C5AF2]">$9.00</div>
                    <div className="text-base text-[#8C5AF2]/70">/month</div>
                  </div>
                </div>

                {/* plan title */}
                <h3 className="mt-3 text-[28px] sm:text-[32px] font-[700] text-[#141217]">Pro Plan</h3>

                {/* subscribed since divider with right-aligned date */}
                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#8A8A8A]">
                      {subscriptionStatus ? 'Subscribed Since' : 'Member Since'}
                    </span>
                    <div className="h-px flex-1 bg-[#E2DFEA]" />
                    <span className="text-xs text-[#8A8A8A]">{subscribedDateText}</span>
                  </div>
                </div>

                {/* helper line */}
                <p className="mt-3 text-sm text-[#7A5AF8]">You're currently using the Pro plan</p>

                {/* features row */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-center gap-2 text-[13px] text-[#4B4B4B]">
                    <CheckCircle2 className="h-4 w-4 text-[#7A5AF8]" aria-hidden="true" />
                    <span>Unlimited stories (paying users on your IP are exempt from limits)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-[#4B4B4B]">
                    <CheckCircle2 className="h-4 w-4 text-[#7A5AF8]" aria-hidden="true" />
                    <span>Priority generation queue</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-[#4B4B4B]">
                    <CheckCircle2 className="h-4 w-4 text-[#7A5AF8]" aria-hidden="true" />
                    <span>Premium PDF (print-ready)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-[#4B4B4B]">
                    <CheckCircle2 className="h-4 w-4 text-[#7A5AF8]" aria-hidden="true" />
                    <span>Saved prompts & favorites</span>
                  </div>
                </div>
              </article>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Free card */}
                <article className="md:col-span-2 rounded-[20px] bg-[#F4F2F7] border border-[#E7E4EC] py-6 px-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-[#666] text-sm">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#34C759]" aria-hidden="true" />
                      <span>Active</span>
                    </div>
                    <div className="text-[40px] leading-none font-extrabold tracking-tight text-[#8C5AF2]">$0.00</div>
                  </div>

                  <h3 className="mt-3 text-[28px] sm:text-[32px] font-[700] text-[#141217]">Free Plan</h3>

                  <div className="mt-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[#8A8A8A]">Member Since</span>
                      <div className="h-px flex-1 bg-[#E2DFEA]" />
                      <span className="text-xs text-[#8A8A8A]">{subscribedDateText}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-[#7A5AF8]">You're currently using the free plan</p>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="flex items-center gap-2 text-[13px] text-[#4B4B4B]">
                      <CheckCircle2 className="h-4 w-4 text-[#7A5AF8]" aria-hidden="true" />
                      <span>1 story every 15 minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-[#4B4B4B]">
                      <CheckCircle2 className="h-4 w-4 text-[#7A5AF8]" aria-hidden="true" />
                      <span>2 stories per day (per IP)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-[#4B4B4B]">
                      <CheckCircle2 className="h-4 w-4 text-[#7A5AF8]" aria-hidden="true" />
                      <span>Standard PDF download</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-[#4B4B4B]">
                      <CheckCircle2 className="h-4 w-4 text-[#7A5AF8]" aria-hidden="true" />
                      <span>AI story generation & preview</span>
                    </div>
                  </div>
                </article>

                {/* Pro promo card */}
                <article
                  className="md:col-span-1 rounded-[20px] border border-[#E7E4EC] p-6 text-white"
                  style={{ background: "linear-gradient(145deg, #7C4DFF 0%, #F0B429 100%)" }}
                >
                  <p className="text-[18px] font-[700] text-[#FDF4C8]">Pro Plan</p>

                  <div className="mt-3 flex items-baseline gap-2">
                    <div className="text-[40px] leading-none font-extrabold tracking-tight">$9.00</div>
                    <div className="text-base text-white/90">/month</div>
                  </div>

                  <p className="mt-2 text-[13px] text-white/90">Unlimited stories for serious creators.</p>

                  <div className="mt-8">
                    <button
                      onClick={!loading ? handleUpgradeToPro : undefined}
                      disabled={loading}
                      className={`w-full rounded-[10px] h-[44px] bg-white text-[#7C4DFF] px-4 text-sm font-semibold transition active:scale-[.98]
                        ${loading ? "opacity-60 cursor-not-allowed" : "hover:bg-white/90"}`}
                    >
                      {loading ? "Redirecting..." : "Upgrade to Pro"}
                    </button>
                  </div>
                </article>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
export default UserProfile
