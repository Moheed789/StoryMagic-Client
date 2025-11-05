import React, { useEffect, useState } from "react";
import { useToast } from "../hooks/use-toast";
import Modal from "./Modal";
// @ts-ignore
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
  standard: { price: 6.69, label: "Standard", eta: "11–13 days" },
  express: { price: 21.74, label: "Express", eta: "6–8 days" },
};

/* ---------------- ZIP ↔ STATE VALIDATION ---------------- */
const ZIP_RANGES: Record<string, Array<{ start: number; end: number }>> = {
  AL: [{ start: 35000, end: 36999 }],
  AK: [{ start: 99500, end: 99999 }],
  AZ: [{ start: 85000, end: 86999 }],
  AR: [{ start: 71600, end: 72999 }, { start: 75502, end: 75502 }],
  CA: [{ start: 90000, end: 96199 }],
  CO: [{ start: 80000, end: 81699 }],
  CT: [{ start: 6000, end: 6999 }],
  DC: [{ start: 20000, end: 20599 }],
  DE: [{ start: 19700, end: 19999 }],
  FL: [{ start: 32000, end: 34999 }],
  GA: [{ start: 30000, end: 31999 }, { start: 39800, end: 39999 }],
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
  MA: [{ start: 1000, end: 2799 }, { start: 5500, end: 5599 }],
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
  TX: [{ start: 75000, end: 79999 }, { start: 88500, end: 88599 }],
  UT: [{ start: 84000, end: 84799 }],
  VT: [{ start: 5000, end: 5999 }],
  VA: [{ start: 20100, end: 20199 }, { start: 22000, end: 24699 }],
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

/* ---------- Non-space limits + digit counters ---------- */
const NON_SPACE_LIMIT = 30;

function truncateByNonSpaceLimit(input: string, limit: number): string {
  let count = 0, out = "";
  for (const ch of input) {
    if (/\s/.test(ch)) { out += ch; continue; }
    if (count < limit) { out += ch; count++; } else { break; }
  }
  return out;
}
function nonSpaceCount(s: string) {
  return s.replace(/\s/g, "").length;
}
/* ZIP: count only digits (spaces ignored) */
function digitCount(s: string) {
  return (s.match(/\d/g) || []).length;
}
function digitsOnlyMax5(s: string) {
  return (s.match(/\d/g) || []).join("").slice(0, 5);
}

interface BookCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookForm: BookPurchaseForm | null;
  setBookForm: React.Dispatch<React.SetStateAction<BookPurchaseForm | null>>;
  onCheckout: (form: BookPurchaseForm) => Promise<void>;
}

const BookCustomizationModal: React.FC<BookCustomizationModalProps> = ({
  isOpen,
  onClose,
  bookForm,
  setBookForm,
  onCheckout,
}) => {
  const { toast } = useToast();
  const [citySuggestionsOpen, setCitySuggestionsOpen] = useState(false);
  const [stateText, setStateText] = useState("");
  const [stateSuggestionsOpen, setStateSuggestionsOpen] = useState(false);

  const getStateFromCity = (city: string) => {
    const map: Record<string, string> = {
      "New York": "NY", "Los Angeles": "CA", Chicago: "IL", Houston: "TX",
      Dallas: "TX", "San Francisco": "CA", Miami: "FL", Seattle: "WA",
      Atlanta: "GA", Boston: "MA", Denver: "CO", "Las Vegas": "NV",
      Phoenix: "AZ", Portland: "OR", Orlando: "FL", Austin: "TX",
      "San Diego": "CA", Charlotte: "NC", Washington: "DC", Philadelphia: "PA",
    };
    return map[city] || "";
  };

  const stateMatches = US_STATES.filter((s: { code: string; name: string }) => {
    const q = stateText.toLowerCase().trim();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  }).slice(0, 10);

  useEffect(() => {
    if (!bookForm) return;
    const found = US_STATES.find(
      (s: { code: string; name: string }) =>
        s.code === bookForm.shipping_address.state_code
    );
    setStateText(found ? found.name : "");
  }, [bookForm?.shipping_address.state_code]);

  const calcTotal = (form: BookPurchaseForm | null) => {
    if (!form) return 0;
    const book = PAGE_PRICES[form.pageOption];
    const shipping = SHIPPING_PRICES[form.shipping].price;
    return book + shipping;
  };

  const isAddressValid = (addr: ShippingAddress) => {
    return (
      addr.name.trim() &&
      addr.street1.trim() &&
      addr.city.trim() &&
      addr.state_code.trim() &&
      addr.postcode.trim() &&
      addr.country_code.trim() &&
      addr.phone_number.trim()
    );
  };

  const formatUSPhone = (digits: string) => {
    if (!digits) return "";
    const d = digits.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const validateZipAgainstState = () => {
    if (!bookForm) return true;
    const zip = bookForm.shipping_address.postcode;
    const st = bookForm.shipping_address.state_code;
    if (zip.length !== 5) {
      toast({
        title: "Invalid ZIP Code",
        description: "ZIP Code must be exactly 5 digits.",
        variant: "destructive",
      });
      return false;
    }
    if (st && !zipMatchesState(zip, st)) {
      toast({
        title: "ZIP doesn’t match the state",
        description: `You selected ${st}, but ZIP ${zip} belongs to a different state. Please fix the ZIP or the state.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!bookForm) return;

    if (!isAddressValid(bookForm.shipping_address)) {
      toast({
        title: "Address incomplete",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!validateZipAgainstState()) return;

    const payload = {
      ...bookForm,
      shipping_address: { ...bookForm.shipping_address },
      phone_number: `+1${bookForm.shipping_address.phone_number}`,
      total_price: calcTotal(bookForm),
    };

    await onCheckout(payload as BookPurchaseForm);
    onClose();
  };

  if (!bookForm) return null;

  const filteredCities = MAJOR_US_CITIES.filter((c: string) =>
    c.toLowerCase().includes(bookForm.shipping_address.city.toLowerCase())
  ).slice(0, 10);

  // address line helpers (30 non-space limit)
  const updateStreet = (field: "street1" | "street2", raw: string) => {
    const truncated = truncateByNonSpaceLimit(raw, NON_SPACE_LIMIT);
    setBookForm((prev) =>
      prev
        ? { ...prev, shipping_address: { ...prev.shipping_address, [field]: truncated } }
        : prev
    );
  };
  const street1Count = nonSpaceCount(bookForm.shipping_address.street1);
  const street2Count = nonSpaceCount(bookForm.shipping_address.street2);

  // ZIP helpers (count digits only, spaces ignored)
  const zipCount = digitCount(bookForm.shipping_address.postcode);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Order Your Printed Book"
      maxWidth="w-full sm:max-w-[580px]"
      className="max-h-[100vh] mt-28 mb-7 sm:mt-24 overflow-y-auto"
    >
      <div className="pb-5 space-y-5 px-4 sm:px-6">
        {/* PAGE COUNT */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Page count</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["10", "15", "20"] as Array<"10" | "15" | "20">).map((p) => {
              const isSelected = bookForm.pageOption === p;
              return (
                <button
                  key={p}
                  disabled={!isSelected}
                  className={`rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? "border-[#8C5AF2] bg-[#F8F6FF]"
                      : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
                  }`}
                >
                  <p className="text-sm font-semibold">{p} pages</p>
                  <p className="text-xs mt-1">${PAGE_PRICES[p].toFixed(2)}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* SHIPPING OPTIONS */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Shipping</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["standard", "express"] as const).map((option) => (
              <button
                key={option}
                onClick={() =>
                  setBookForm((prev) =>
                    prev ? { ...prev, shipping: option } : prev
                  )
                }
                className={`rounded-xl border p-3 text-left transition ${
                  bookForm.shipping === option
                    ? "border-[#8C5AF2] bg-[#F8F6FF]"
                    : "border-slate-200 bg-white hover:border-[#8C5AF2]/50"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">
                  {SHIPPING_PRICES[option].label}
                </p>
                <p className="text-xs text-slate-500">
                  ${SHIPPING_PRICES[option].price.toFixed(2)} •{" "}
                  {SHIPPING_PRICES[option].eta}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ADDRESS SECTION */}
        <div className="border-t border-slate-200 pt-4">
          <p className="text-sm font-medium text-slate-700 mb-3">
            Shipping address
          </p>

          <div className="grid grid-cols-1 gap-3">
            {/* FULL NAME */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Full name
              </label>
              <input
                type="text"
                value={bookForm.shipping_address.name}
                onChange={(e) =>
                  setBookForm((prev) =>
                    prev
                      ? { ...prev, shipping_address: { ...prev.shipping_address, name: e.target.value } }
                      : prev
                  )
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40"
                placeholder="Enter full name"
              />
            </div>

            {/* ADDRESS LINES WITH 30 NON-SPACE LIMIT */}
            {(["street1", "street2"] as const).map((field, i) => (
              <div key={field}>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-500 mb-1 block">
                    {i === 0 ? "Address line 1" : "Address line 2 (optional)"}
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {field === "street1"
                      ? `${street1Count}/${NON_SPACE_LIMIT}`
                      : `${street2Count}/${NON_SPACE_LIMIT}`}
                  </span>
                </div>
                <input
                  type="text"
                  value={bookForm.shipping_address[field]}
                  onChange={(e) => updateStreet(field, e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40 ${
                    (field === "street1" ? street1Count : street2Count) >= NON_SPACE_LIMIT
                      ? "border-amber-400"
                      : "border-slate-200"
                  }`}
                  placeholder={i === 0 ? "Enter your street address" : "Apartment, suite, etc."}
                />
              </div>
            ))}

            {/* COUNTRY + STATE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Country</label>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 w-full">
                  <div className="w-6 h-4 rounded-sm overflow-hidden border border-gray-300">
                    <svg viewBox="0 0 60 30" className="w-full h-full">
                      <clipPath id="s"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
                      <g clipPath="url(#s)">
                        <path d="M0,0 v30 h60 v-30 z" fill="#b22234" />
                        <path d="M0,2 h60 M0,6 h60 M0,10 h60 M0,14 h60 M0,18 h60 M0,22 h60 M0,26 h60" stroke="#fff" strokeWidth="2" />
                        <rect width="24" height="16" fill="#3c3b6e" />
                      </g>
                    </svg>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700 flex-1">United States</div>
                </div>
                <input type="hidden" value={bookForm.shipping_address.country_code} readOnly />
              </div>

              {/* STATE */}
              <div className="relative">
                <label className="text-xs text-slate-500 mb-1 block">State</label>
                <input
                  type="text"
                  value={stateText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStateText(val);
                    setStateSuggestionsOpen(val.length > 0);
                    const codeGuess = val.trim().toUpperCase();
                    if (/^[A-Z]{2}$/.test(codeGuess)) {
                      const match = US_STATES.find((s: { code: string }) => s.code === codeGuess);
                      if (match) {
                        setBookForm((prev) =>
                          prev
                            ? { ...prev, shipping_address: { ...prev.shipping_address, state_code: match.code, city: "" } }
                            : prev
                        );
                      }
                    }
                  }}
                  onFocus={() => setStateSuggestionsOpen(true)}
                  onBlur={() => setTimeout(() => setStateSuggestionsOpen(false), 150)}
                  placeholder="Type state name or code (e.g., California or CA)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40 bg-white"
                />

                {stateSuggestionsOpen && stateMatches.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                    {stateMatches.map((s: { code: string; name: string }) => (
                      <div
                        key={s.code}
                        onMouseDown={() => {
                          setStateText(s.name);
                          setBookForm((prev) =>
                            prev
                              ? { ...prev, shipping_address: { ...prev.shipping_address, state_code: s.code, city: "" } }
                              : prev
                          );
                          setStateSuggestionsOpen(false);
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

            {/* CITY + ZIP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <label className="text-xs text-slate-500 mb-1 block">City</label>
                <input
                  type="text"
                  value={bookForm.shipping_address.city}
                  onChange={(e) => {
                    const value = e.target.value;
                    setBookForm((prev) =>
                      prev ? { ...prev, shipping_address: { ...prev.shipping_address, city: value } } : prev
                    );
                    setCitySuggestionsOpen(value.length > 0);
                  }}
                  onFocus={() => setCitySuggestionsOpen(true)}
                  onBlur={() => setTimeout(() => setCitySuggestionsOpen(false), 150)}
                  placeholder="Start typing your city"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40"
                />

                {citySuggestionsOpen && filteredCities.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredCities.map((city: string) => (
                      <div
                        key={city}
                        onMouseDown={() => {
                          const code = getStateFromCity(city);
                          setBookForm((prev) =>
                            prev
                              ? { ...prev, shipping_address: { ...prev.shipping_address, city, state_code: code || prev.shipping_address.state_code } }
                              : prev
                          );
                          setCitySuggestionsOpen(false);
                        }}
                        className="px-3 py-2 text-sm text-slate-700 hover:bg-[#F8F6FF] cursor-pointer"
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ZIP with digit-only 5 limit + live counter (spaces ignored) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-500 mb-1 block">ZIP Code</label>
                  <span className="text-[11px] text-slate-500">{zipCount}/5</span>
                </div>
                <input
                  type="text"
                  value={bookForm.shipping_address.postcode}
                  onChange={(e) => {
                    // Allow user to type anything, but store only up to 5 digits (spaces ignored)
                    const normalized = digitsOnlyMax5(e.target.value);
                    setBookForm((prev) =>
                      prev
                        ? { ...prev, shipping_address: { ...prev.shipping_address, postcode: normalized } }
                        : prev
                    );
                  }}
                  onBlur={() => {
                    // exact 5 + state match checks
                    validateZipAgainstState();
                  }}
                  inputMode="numeric"
                  pattern="\d{5}"
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40 ${
                    zipCount >= 5 ? "border-amber-400" : "border-slate-200"
                  }`}
                  placeholder="Enter ZIP Code"
                  maxLength={10} /* user can type spaces but we only store digits up to 5 */
                />
              </div>
            </div>

            {/* PHONE */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Phone</label>
              <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-[#8C5AF2]/40">
                <div className="flex items-center gap-2 px-3 py-2 border-r border-slate-200 bg-slate-50">
                  <div className="w-5 h-3 rounded-sm overflow-hidden border border-gray-300">
                    <svg viewBox="0 0 60 30" className="w-full h-full">
                      <clipPath id="phone-s"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
                      <g clipPath="url(#phone-s)">
                        <path d="M0,0 v30 h60 v-30 z" fill="#b22234" />
                        <path d="M0,2 h60 M0,6 h60 M0,10 h60 M0,14 h60 M0,18 h60 M0,22 h60 M0,26 h60" stroke="#fff" strokeWidth="2" />
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
                    setBookForm((prev) =>
                      prev
                        ? { ...prev, shipping_address: { ...prev.shipping_address, phone_number: raw } }
                        : prev
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

        {/* TOTAL */}
        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-lg font-semibold text-slate-900">
              ${calcTotal(bookForm).toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Includes story printing + {SHIPPING_PRICES[bookForm.shipping].label} shipping.
            </p>
          </div>
        </div>

        <button
          className="w-full h-11 rounded-xl bg-[#8C5AF2] text-white font-semibold hover:bg-[#7C4AE8] transition disabled:opacity-60"
          disabled={
            !isAddressValid(bookForm.shipping_address) ||
            bookForm.shipping_address.postcode.length !== 5
          }
          onClick={handleCheckout}
        >
          Continue to payment
        </button>
      </div>
    </Modal>
  );
};

export default BookCustomizationModal;
