"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const UserProfile = () => {
  const { user, getUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false); 

  const subscriptionStatus = user?.apiProfile?.subscriptionStatus === "premium";

  const getSubscribedDate = () => {
    const profile = user?.apiProfile;
    const subscriptionDate = profile?.subscriptionStart;

    if (subscriptionDate) {
      const date =
        typeof subscriptionDate === "number"
          ? new Date(subscriptionDate * 1000)
          : new Date(subscriptionDate);
      return date;
    }

    const accountDate =
      profile?.createdAt ||
      profile?.created_at ||
      profile?.registrationDate ||
      profile?.accountCreated;

    if (accountDate) {
      const date =
        typeof accountDate === "number"
          ? new Date(accountDate * 1000)
          : new Date(accountDate);
      return date;
    }

    return new Date();
  };

  const subscribedDate = getSubscribedDate();
  const subscribedDateText = subscribedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <div className="min-h-screen w-full bg-[#F7F6FA] text-slate-900">
      <header className="py-10">
        <h1 className="text-center text-[40px] md:text-[64px] font-[400] text-[#24212C] font-display">
          User Profile
        </h1>
      </header>

      <main className="mx-auto max-w-[1580px] px-4 pb-16">
        <section className="rounded-[16px] bg-white shadow-sm ring-1 ring-slate-100">
          <div className="border-b border-slate-100 p-6 sm:p-8">
            <h2 className="text-[26px] md:text-[32px] font-[400] text-[#8C5AF2] font-display">
              Personal Information
            </h2>

            <div className="mt-6 grid max-w-lg gap-4">
              <div>
                <label className="mb-1 block text-[16px] font-[400] font-story text-[#999999]">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue={user?.apiProfile?.fullName}
                  readOnly={!isEditing} 
                  className={`w-full rounded-[8px] h-[43px] px-3 py-2 text-[16px] font-story outline-none ${
                    isEditing
                      ? "bg-white border border-[#6A4DF5] focus:ring-2 focus:ring-[#6A4DF5]/20"
                      : "bg-[#F5F5F5] text-[#BBB0CF] cursor-not-allowed"
                  }`}
                />
              </div>

              <div>
                <label className="mb-1 block text-[16px] font-[400] font-story text-[#999999]">
                  Email
                </label>
                <input
                  disabled
                  type="email"
                  defaultValue={user?.apiProfile?.email}
                  className="w-full bg-[#F5F5F5] rounded-[8px] cursor-not-allowed text-[#BBB0CF] h-[43px] px-3 py-2 text-[16px] font-story"
                />
              </div>

              <div className="pt-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    type="button"
                    className="inline-flex items-center rounded-lg bg-[#8C5AF2] px-[54px] py-[13px] text-sm font-semibold text-white shadow-sm transition active:scale-[.98] hover:bg-[#825fc7]"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      type="button"
                      className="inline-flex items-center rounded-lg bg-gray-300 px-[40px] py-[13px] text-sm font-semibold text-black shadow-sm transition active:scale-[.98]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                      }}
                      type="button"
                      className="inline-flex items-center rounded-lg bg-[#8C5AF2] px-[40px] py-[13px] text-sm font-semibold text-white shadow-sm transition active:scale-[.98] hover:bg-[#825fc7]"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default UserProfile;
