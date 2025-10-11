import React from "react";

export default function Subscription() {
  return (
    <div className="min-h-screen w-full bg-[#F7F6FA] text-slate-900">
      <header className="py-10">
        <h1 className="text-center text-[64px] font-[400] text-[#24212C] font-display">
          Account Settings
        </h1>
      </header>

      {/* Main Card */}
      <main className="mx-auto max-w-6xl px-4 pb-16">
        <section className="rounded-[16px] bg-white shadow-sm ring-1 ring-slate-100">
          {/* Personal Info */}
          <div className="border-b border-slate-100 p-6 sm:p-8">
            <h2 className="text-[32px] font-[400] text-[#8C5AF2] font-display ">
              Personal Information
            </h2>

            <div className="mt-6 grid max-w-lg gap-4">
              <div>
                <label className="mb-1 block text-[16px] font-[400] font-story text-[#999999]">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="John"
                  className="w-full text-[#BBB0CF] bg-[#F5F5F5] rounded-[8px] h-[43px]  px-3 py-2 text-[16px] font-story outline-none focus:border-[#6A4DF5] focus:bg-white focus:ring-2 focus:ring-[#6A4DF5]/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-[16px] font-[400] font-story text-[#999999]">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue="JohnSmith2023@gmail.com"
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

          {/* Plans */}
          <div className="p-6 sm:p-8">
            <h2 className="text-[32px] font-[400] text-[#8C5AF2] font-display">
              Choose your Plan
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Free Plan */}
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

                <div className="mt-[75px] ">
                  <button className="w-full rounded-lg h-[43px] bg-[#8C5AF2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#825fc7] active:scale-[.98]">
                    Get Started Free
                  </button>
                </div>
              </article>
              <article className="bg-gradient-to-br from-[#8C5AF2] to-[#F5C73D] border border-[#C3C3C3] py-[36px] px-[30px] rounded-[20px] text-white">
                <p className="text-[26px] font-display">Pro Plan</p>

                <div className="mt-3 flex items-end gap-2">
                  <div className="text-4xl font-extrabold tracking-tight">
                    $ 9.00
                  </div>
                  <div className="pb-1 text-white/80">/month</div>
                </div>

                <p className="mt-1 text-[13px] text-white/80">
                  Start creating — no credit card needed.
                </p>

                <div className="mt-5">
                  <p className="text-[22px] font-sans font-[700]">Highlights</p>
                  <ul className="mt-3 space-y-2 text-sm text-white/90">
                    <li>
                      Unlimited stories (paying users on your IP are exempt from
                      limits)
                    </li>
                    <li>Priority generation queue</li>
                    <li>Premium PDF (print-ready)</li>
                    <li>Saved prompts & favorites</li>
                    <li>Email support</li>
                  </ul>
                </div>

                <div className="mt-[75px]">
                  <button className="w-full rounded-lg h-[43px] bg-white text-[#8C5AF2] px-4 py-2 text-sm font-semibold transition hover:bg-white/90 active:scale-[.98]">
                    Upgrade to Pro
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
