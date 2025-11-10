import React, { useEffect, useState } from "react";
import { useToast } from "../hooks/use-toast";
import Modal from "./Modal";
import { fetchAuthSession } from "aws-amplify/auth";
import { US_STATES, MAJOR_US_CITIES } from "../utils/mockData";

type ShippingAddress = {
  name: string;
  street1: string;
  street2: string;
  city: string;
  state_code: string;
  postcode: string;
  country_code: string;
  phone_number: string;
};

type BookPurchaseForm = {
  storyId: string;
  pageOption: "10" | "15" | "20";
  shipping: "standard" | "express";
  shipping_address: ShippingAddress;
};

const PAGE_PRICES: Record<"10" | "15" | "20", number> = {
  "10": 16.99,
  "15": 18.99,
  "20": 20.99,
};

const SHIPPING_PRICES: Record<
  "standard" | "express",
  { price: number; label: string; eta: string }
> = {
  standard: { price: 6.69, label: "Standard", eta: "11–13 Days" },
  express: { price: 21.74, label: "Express", eta: "6–8 Days" },
};

const ZIP_RANGES: Record<string, Array<{ start: number; end: number }>> = {
  AL: [{ start: 35000, end: 36999 }],
  AK: [{ start: 99500, end: 99999 }],
  AZ: [{ start: 85000, end: 86999 }],
  AR: [
    { start: 71600, end: 72999 },
    { start: 75502, end: 75502 },
  ],
  CA: [{ start: 90000, end: 96199 }],
  CO: [{ start: 80000, end: 81699 }],
  CT: [{ start: 6000, end: 6999 }],
  DC: [{ start: 20000, end: 20599 }],
  DE: [{ start: 19700, end: 19999 }],
  FL: [{ start: 32000, end: 34999 }],
  GA: [
    { start: 30000, end: 31999 },
    { start: 39800, end: 39999 },
  ],
  HI: [{ start: 96700, end: 96899 }],
  ID: [{ start: 83200, end: 83899 }],
  IL: [{ start: 60000, end: 62999 }],
  IN: [{ start: 46000, end: 47999 }],
  IA: [{ start: 50000, end: 52899 }],
  KS: [{ start: 66000, end: 67999 }],
  KY: [{ start: 40000, end: 42799 }],
  LA: [{ start: 70000, end: 71499 }],
  ME: [{ start: 3900, end: 4999 }],
  MD: [{ start: 20600, end: 21999 }],
  MA: [
    { start: 1000, end: 2799 },
    { start: 5500, end: 5599 },
  ],
  MI: [{ start: 48000, end: 49999 }],
  MN: [{ start: 55000, end: 56799 }],
  MS: [{ start: 38600, end: 39799 }],
  MO: [{ start: 63000, end: 65899 }],
  MT: [{ start: 59000, end: 59999 }],
  NE: [{ start: 68000, end: 69399 }],
  NV: [{ start: 88900, end: 89899 }],
  NH: [{ start: 3000, end: 3899 }],
  NJ: [{ start: 7000, end: 8999 }],
  NM: [{ start: 87000, end: 88499 }],
  NY: [{ start: 10000, end: 14999 }],
  NC: [{ start: 27000, end: 28999 }],
  ND: [{ start: 58000, end: 58899 }],
  OH: [{ start: 43000, end: 45999 }],
  OK: [{ start: 73000, end: 74999 }],
  OR: [{ start: 97000, end: 97999 }],
  PA: [{ start: 15000, end: 19699 }],
  RI: [{ start: 2800, end: 2999 }],
  SC: [{ start: 29000, end: 29999 }],
  SD: [{ start: 57000, end: 57799 }],
  TN: [{ start: 37000, end: 38599 }],
  TX: [
    { start: 75000, end: 79999 },
    { start: 88500, end: 88599 },
  ],
  UT: [{ start: 84000, end: 84799 }],
  VT: [{ start: 5000, end: 5999 }],
  VA: [
    { start: 20100, end: 20199 },
    { start: 22000, end: 24699 },
  ],
  WA: [{ start: 98000, end: 99499 }],
  WV: [{ start: 24700, end: 26899 }],
  WI: [{ start: 53000, end: 54999 }],
  WY: [{ start: 82000, end: 83199 }],
};

function zipMatchesState(zip5: string, stateCode: string): boolean {
  const code = (stateCode || "").toUpperCase();
  if (!/^\d{5}$/.test(zip5) || !ZIP_RANGES[code]) return false;
  const n = parseInt(zip5, 10);
  return ZIP_RANGES[code].some(({ start, end }) => n >= start && n <= end);
}

const CITY_TO_STATE: Record<string, string> = {
  "New York": "NY",
  "Los Angeles": "CA",
  Chicago: "IL",
  Houston: "TX",
  Phoenix: "AZ",
  Philadelphia: "PA",
  "San Antonio": "TX",
  "San Diego": "CA",
  Dallas: "TX",
  "San Jose": "CA",
  Austin: "TX",
  Jacksonville: "FL",
  "Fort Worth": "TX",
  Columbus: "OH",
  Charlotte: "NC",
  "San Francisco": "CA",
  Indianapolis: "IN",
  Seattle: "WA",
  Denver: "CO",
  Washington: "DC",
  Boston: "MA",
  Nashville: "TN",
  Detroit: "MI",
  "Oklahoma City": "OK",
  Portland: "OR",
  "Las Vegas": "NV",
  Miami: "FL",
  Orlando: "FL",
  Atlanta: "GA",
  "Kansas City": "MO",
  "Virginia Beach": "VA",
  Oakland: "CA",
  Minneapolis: "MN",
  Tulsa: "OK",
  Wichita: "KS",
  "New Orleans": "LA",
  Arlington: "TX",
  Cleveland: "OH",
  Pittsburgh: "PA",
  Cincinnati: "OH",
};

const stateNameFromCode = (code: string) =>
  US_STATES.find((s: { code: string }) => s.code === code)?.name || "";

const lookupStateByCity = (city: string) => {
  const entry = Object.keys(CITY_TO_STATE).find(
    (k) => k.toLowerCase() === city.trim().toLowerCase()
  );
  return entry ? CITY_TO_STATE[entry] : "";
};

const NON_SPACE_LIMIT = 30;
const nonSpaceCount = (s: string) => s.replace(/\s/g, "").length;

function truncateByNonSpaceLimit(input: string, limit: number): string {
  let count = 0,
    out = "";
  for (const ch of input) {
    if (/\s/.test(ch)) {
      out += ch;
      continue;
    }
    if (count < limit) {
      out += ch;
      count++;
    } else {
      break;
    }
  }
  return out;
}

const digitCount = (s: string) => (s.match(/\d/g) || []).length;
const digitsOnlyMax5 = (s: string) =>
  (s.match(/\d/g) || []).join("").slice(0, 5);

const formatUSPhone = (digits: string) => {
  const d = (digits || "").replace(/\D/g, "").slice(0, 10);
  if (!d) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookForm: BookPurchaseForm | null;
  setBookForm: React.Dispatch<React.SetStateAction<BookPurchaseForm | null>>;
  onCheckout: (form: BookPurchaseForm) => Promise<void>;
}

const BookCustomizationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  bookForm,
  setBookForm,
  onCheckout,
}) => {
  const { toast } = useToast();
  const [cityOpen, setCityOpen] = useState(false);
  const [stateText, setStateText] = useState("");
  const [stateOpen, setStateOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookForm) return;
    const found = US_STATES.find(
      (s: { code: string; name: string }) =>
        s.code === bookForm.shipping_address.state_code
    );
    setStateText(found ? found.name : "");
  }, [bookForm?.shipping_address.state_code]);

  if (!bookForm) return null;

  const bookPrice = PAGE_PRICES[bookForm.pageOption];
  const ship = SHIPPING_PRICES[bookForm.shipping];
  const total = bookPrice + ship.price;

  const isAddressComplete = (a: ShippingAddress) =>
    a.name.trim() &&
    a.street1.trim() &&
    a.city.trim() &&
    a.state_code.trim() &&
    a.postcode.trim() &&
    a.country_code.trim() &&
    a.phone_number.trim();

  const validateZip = () => {
    const zip = bookForm.shipping_address.postcode;
    const st = bookForm.shipping_address.state_code;
    if (zip.length !== 5) {
      toast({
        title: "Invalid ZIP",
        description: "ZIP must be 5 digits.",
        variant: "destructive",
      });
      return false;
    }
    if (st && !zipMatchesState(zip, st)) {
      toast({
        title: "ZIP doesn’t match state",
        description: `ZIP ${zip} does not belong to ${st}. Please correct it.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const citySuggestions = MAJOR_US_CITIES.filter((c: string) =>
    c.toLowerCase().includes(bookForm.shipping_address.city.toLowerCase())
  ).slice(0, 10);

  const street1Count = nonSpaceCount(bookForm.shipping_address.street1);
  const street2Count = nonSpaceCount(bookForm.shipping_address.street2);
  const zipCount = digitCount(bookForm.shipping_address.postcode);

  const handleCheckout = async () => {
    if (!isAddressComplete(bookForm.shipping_address)) {
      toast({
        title: "Address incomplete",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (!validateZip()) return;

    setLoading(true);
    try {
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();

      const verifyPayload = {
        line1: bookForm.shipping_address.street1,
        line2: bookForm.shipping_address.street2,
        city: bookForm.shipping_address.city,
        state_code: bookForm.shipping_address.state_code,
        postcode: bookForm.shipping_address.postcode,
        country_code: bookForm.shipping_address.country_code,
      };

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/address-verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(verifyPayload),
          mode: "cors",
        }
      );

      const data = await response.json();

      if (!data?.valid) {
        toast({
          title: "Address Verification Failed",
          description:
            data?.feedback || "Invalid address. Please review your entry.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const payload = {
        ...bookForm,
        shipping_address: { ...bookForm.shipping_address },
        phone_number: `+1${bookForm.shipping_address.phone_number}`,
        total_price: total,
      };

      await onCheckout(payload as BookPurchaseForm);
      onClose();
    } catch (error) {
      console.error("Address verification error:", error);
      toast({
        title: "Verification Error",
        description: "Something went wrong while verifying the address.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Order your Printed Book"
      maxWidth="w-full sm:max-w-[580px]"
      className="max-h-[100vh] mt-24 mb-7 overflow-y-auto"
    >
      <div className="pb-6 px-4 sm:px-6 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">Shipping</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["standard", "express"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() =>
                  setBookForm((prev) =>
                    prev ? { ...prev, shipping: opt } : prev
                  )
                }
                className={`rounded-xl border p-3 text-left transition ${
                  bookForm.shipping === opt
                    ? "border-[#8C5AF2] bg-[#F8F6FF]"
                    : "border-slate-200 bg-white hover:border-[#8C5AF2]/50"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">
                  {SHIPPING_PRICES[opt].label}
                </p>
                <p className="text-xs text-slate-500">
                  ${SHIPPING_PRICES[opt].price.toFixed(2)} ·{" "}
                  {SHIPPING_PRICES[opt].eta}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <p className="text-sm font-medium text-slate-700 mb-3">
            Shipping Address
          </p>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Full Name
              </label>
              <input
                type="text"
                value={bookForm.shipping_address.name}
                onChange={(e) =>
                  setBookForm((p) =>
                    p
                      ? {
                          ...p,
                          shipping_address: {
                            ...p.shipping_address,
                            name: e.target.value,
                          },
                        }
                      : p
                  )
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40"
                placeholder="Enter full name"
              />
            </div>

            {(["street1", "street2"] as const).map((field, i) => (
              <div key={field}>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-500 mb-1 block">
                    {i === 0 ? "Address Line 1" : "Address Line 2 (optional)"}
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {field === "street1" ? street1Count : street2Count}/
                    {NON_SPACE_LIMIT}
                  </span>
                </div>
                <input
                  type="text"
                  value={bookForm.shipping_address[field]}
                  onChange={(e) =>
                    setBookForm((p) =>
                      p
                        ? {
                            ...p,
                            shipping_address: {
                              ...p.shipping_address,
                              [field]: truncateByNonSpaceLimit(
                                e.target.value,
                                NON_SPACE_LIMIT
                              ),
                            },
                          }
                        : p
                    )
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40 ${
                    (field === "street1" ? street1Count : street2Count) >=
                    NON_SPACE_LIMIT
                      ? "border-amber-400"
                      : "border-slate-200"
                  }`}
                  placeholder={
                    i === 0
                      ? "Enter your street address"
                      : "Apartment, suite, etc."
                  }
                />
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Country
                </label>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 w-full">
                  <div className="w-6 h-4 rounded-sm overflow-hidden border border-gray-300">
                    <svg viewBox="0 0 60 30" className="w-full h-full">
                      <clipPath id="us-flag-clip">
                        <path d="M0,0 v30 h60 v-30 z" />
                      </clipPath>
                      <g clipPath="url(#us-flag-clip)">
                        <path d="M0,0 v30 h60 v-30 z" fill="#b22234" />
                        <path
                          d="M0,2 h60 M0,6 h60 M0,10 h60 M0,14 h60 M0,18 h60 M0,22 h60 M0,26 h60"
                          stroke="#fff"
                          strokeWidth="2"
                        />
                        <rect width="24" height="16" fill="#3c3b6e" />
                      </g>
                    </svg>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700 flex-1">
                    United States
                  </div>
                </div>
                <input
                  type="hidden"
                  value={bookForm.shipping_address.country_code}
                  readOnly
                />
              </div>

              <div className="relative">
                <label className="text-xs text-slate-500 mb-1 block">
                  State
                </label>
                <input
                  type="text"
                  value={stateText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStateText(val);
                    setStateOpen(val.length > 0);
                  }}
                  onFocus={() => setStateOpen(true)}
                  onBlur={() => setTimeout(() => setStateOpen(false), 150)}
                  placeholder="Type state name or code, e.g., CA"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40 bg-white"
                />
                {stateOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                    {US_STATES.filter((s: { code: string; name: string }) => {
                      const q = stateText.toLowerCase().trim();
                      return (
                        s.name.toLowerCase().includes(q) ||
                        s.code.toLowerCase().includes(q)
                      );
                    })
                      .slice(0, 10)
                      .map((s: { code: string; name: string }) => (
                        <div
                          key={s.code}
                          onMouseDown={() => {
                            setStateText(s.name);
                            setBookForm((p) =>
                              p
                                ? {
                                    ...p,
                                    shipping_address: {
                                      ...p.shipping_address,
                                      state_code: s.code,
                                      city: "",
                                    },
                                  }
                                : p
                            );
                            setStateOpen(false);
                          }}
                          className="px-3 py-2 text-sm text-slate-700 hover:bg-[#F8F6FF] cursor-pointer"
                        >
                          {s.name} ({s.code})
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <label className="text-xs text-slate-500 mb-1 block">
                  City
                </label>
                <input
                  type="text"
                  value={bookForm.shipping_address.city}
                  onChange={(e) => {
                    const v = e.target.value;
                    setBookForm((p) =>
                      p
                        ? {
                            ...p,
                            shipping_address: {
                              ...p.shipping_address,
                              city: v,
                            },
                          }
                        : p
                    );
                    setCityOpen(v.length > 0);
                    const liveCode = lookupStateByCity(v);
                    if (liveCode) {
                      setBookForm((p) =>
                        p
                          ? {
                              ...p,
                              shipping_address: {
                                ...p.shipping_address,
                                state_code: liveCode,
                              },
                            }
                          : p
                      );
                      setStateText(stateNameFromCode(liveCode));
                    }
                  }}
                  onFocus={() => setCityOpen(true)}
                  onBlur={() => {
                    setTimeout(() => setCityOpen(false), 150);
                    const typed = bookForm.shipping_address.city;
                    const code = lookupStateByCity(typed);
                    if (code) {
                      setBookForm((p) =>
                        p
                          ? {
                              ...p,
                              shipping_address: {
                                ...p.shipping_address,
                                state_code: code,
                              },
                            }
                          : p
                      );
                      setStateText(stateNameFromCode(code));
                    }
                  }}
                  placeholder="Start typing your city"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40"
                />
                {cityOpen && citySuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {citySuggestions.map((city: string) => (
                      <div
                        key={city}
                        onMouseDown={() => {
                          const code = lookupStateByCity(city);
                          setBookForm((p) =>
                            p
                              ? {
                                  ...p,
                                  shipping_address: {
                                    ...p.shipping_address,
                                    city,
                                    state_code:
                                      code || p.shipping_address.state_code,
                                  },
                                }
                              : p
                          );
                          if (code) setStateText(stateNameFromCode(code));
                          setCityOpen(false);
                        }}
                        className="px-3 py-2 text-sm text-slate-700 hover:bg-[#F8F6FF] cursor-pointer"
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-500 mb-1 block">
                    ZIP Code
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {zipCount}/5
                  </span>
                </div>
                <input
                  type="text"
                  value={bookForm.shipping_address.postcode}
                  onChange={(e) =>
                    setBookForm((p) =>
                      p
                        ? {
                            ...p,
                            shipping_address: {
                              ...p.shipping_address,
                              postcode: digitsOnlyMax5(e.target.value),
                            },
                          }
                        : p
                    )
                  }
                  onBlur={validateZip}
                  inputMode="numeric"
                  pattern="\d{5}"
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40 ${
                    zipCount >= 5 ? "border-amber-400" : "border-slate-200"
                  }`}
                  placeholder="Enter ZIP Code"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Phone</label>
              <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-[#8C5AF2]/40">
                <div className="flex items-center gap-2 px-3 py-2 border-r border-slate-200 bg-slate-50">
                  <div className="w-5 h-3 rounded-sm overflow-hidden border border-gray-300">
                    <svg viewBox="0 0 60 30" className="w-full h-full">
                      <clipPath id="us-flag-clip-phone">
                        <path d="M0,0 v30 h60 v-30 z" />
                      </clipPath>
                      <g clipPath="url(#us-flag-clip-phone)">
                        <path d="M0,0 v30 h60 v-30 z" fill="#b22234" />
                        <path
                          d="M0,2 h60 M0,6 h60 M0,10 h60 M0,14 h60 M0,18 h60 M0,22 h60 M0,26 h60"
                          stroke="#fff"
                          strokeWidth="2"
                        />
                        <rect width="24" height="16" fill="#3c3b6e" />
                      </g>
                    </svg>
                  </div>
                  <span className="text-sm text-slate-700">+1</span>
                </div>
                <input
                  type="tel"
                  value={formatUSPhone(bookForm.shipping_address.phone_number)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setBookForm((p) =>
                      p
                        ? {
                            ...p,
                            shipping_address: {
                              ...p.shipping_address,
                              phone_number: raw,
                            },
                          }
                        : p
                    );
                  }}
                  className="flex-1 px-3 py-2 text-sm focus:outline-none bg-transparent"
                  placeholder="(123) 456-7890"
                  maxLength={14}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-sm font-medium text-slate-800">
              Your Book Details
            </p>
          </div>
          <div className="px-4 py-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Pages Count</span>
              <span className="font-medium">{bookForm.pageOption}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Book Price</span>
              <span className="font-medium">${bookPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Shipping</span>
              <span className="font-medium">${ship.price.toFixed(2)}</span>
            </div>
            <div className="pt-2 mt-1 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-800 font-semibold">Total</span>
              <span className="text-[#7B5AE9] font-semibold">
                ${total.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Includes story printing, {ship.label} Shipping
            </p>
          </div>
        </div>

        <button
          className="w-full h-11 rounded-xl bg-[#8C5AF2] text-white font-semibold hover:bg-[#7C4AE8] transition disabled:opacity-60 flex items-center justify-center"
          disabled={
            loading ||
            !isAddressComplete(bookForm.shipping_address) ||
            bookForm.shipping_address.postcode.length !== 5
          }
          onClick={handleCheckout}
        >
          {loading ? "Verifying Address..." : "Continue To Payment"}
        </button>
      </div>
    </Modal>
  );
};

export default BookCustomizationModal;
