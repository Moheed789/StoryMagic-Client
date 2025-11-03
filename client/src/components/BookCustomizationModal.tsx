import React from "react";
import { useToast } from "../hooks/use-toast";
import Modal from "./Modal";
// @ts-ignore: No types available for mockData.js
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

    await onCheckout(bookForm);
    onClose();
  };

  if (!bookForm) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize your printed book"
      maxWidth="max-w-[580px]"
      className="max-h-[100vh] mt-16 overflow-y-auto"
    >
      <div className="pb-5 space-y-5 px-6">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">
            Page count
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(["10", "15", "20"] as Array<"10" | "15" | "20">).map(
              (p) => {
                const isSelected = bookForm.pageOption === p;
                return (
                  <button
                    key={p}
                    disabled={!isSelected}
                    onClick={() => {
                      if (!isSelected) return;
                    }}
                    className={`rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-[#8C5AF2] bg-[#F8F6FF]"
                        : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <p className="text-sm font-semibold">{p} pages</p>
                    <p className="text-xs mt-1">
                      ${PAGE_PRICES[p].toFixed(2)}
                    </p>
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">
            Shipping
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() =>
                setBookForm((prev) =>
                  prev ? { ...prev, shipping: "standard" } : prev
                )
              }
              className={`rounded-xl border p-3 text-left transition ${
                bookForm.shipping === "standard"
                  ? "border-[#8C5AF2] bg-[#F8F6FF]"
                  : "border-slate-200 bg-white hover:border-[#8C5AF2]/50"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">
                Standard
              </p>
              <p className="text-xs text-slate-500">
                ${SHIPPING_PRICES.standard.price.toFixed(2)} .{" "}
                {SHIPPING_PRICES.standard.eta}
              </p>
            </button>
            <button
              onClick={() =>
                setBookForm((prev) =>
                  prev ? { ...prev, shipping: "express" } : prev
                )
              }
              className={`rounded-xl border p-3 text-left transition ${
                bookForm.shipping === "express"
                  ? "border-[#8C5AF2] bg-[#F8F6FF]"
                  : "border-slate-200 bg-white hover:border-[#8C5AF2]/50"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">
                Express
              </p>
              <p className="text-xs text-slate-500">
                ${SHIPPING_PRICES.express.price.toFixed(2)} .{" "}
                {SHIPPING_PRICES.express.eta}
              </p>
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <p className="text-sm font-medium text-slate-700 mb-3">
            Shipping address
          </p>
          <div className="grid grid-cols-1 gap-3">
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
                      ? {
                          ...prev,
                          shipping_address: {
                            ...prev.shipping_address,
                            name: e.target.value,
                          },
                        }
                      : prev
                  )
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40"
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Address line 1
              </label>
              <input
                type="text"
                value={bookForm.shipping_address.street1}
                onChange={(e) =>
                  setBookForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          shipping_address: {
                            ...prev.shipping_address,
                            street1: e.target.value,
                          },
                        }
                      : prev
                  )
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40"
                placeholder="Enter your street address"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Address line 2 (optional)
              </label>
              <input
                type="text"
                value={bookForm.shipping_address.street2}
                onChange={(e) =>
                  setBookForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          shipping_address: {
                            ...prev.shipping_address,
                            street2: e.target.value,
                          },
                        }
                      : prev
                  )
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40"
                placeholder="Apartment, suite, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  City
                </label>
                <select
                  value={bookForm.shipping_address.city}
                  onChange={(e) =>
                    setBookForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            shipping_address: {
                              ...prev.shipping_address,
                              city: e.target.value,
                            },
                          }
                        : prev
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40 bg-white"
                >
                  <option value="">Select City</option>
                  {MAJOR_US_CITIES.map((city: string) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  State
                </label>
                <select
                  value={bookForm.shipping_address.state_code}
                  onChange={(e) =>
                    setBookForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            shipping_address: {
                              ...prev.shipping_address,
                              state_code: e.target.value,
                            },
                          }
                        : prev
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40 bg-white"
                >
                  <option value="">Select State</option>
                  {US_STATES.map((state: { code: string; name: string }) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={bookForm.shipping_address.postcode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                    setBookForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            shipping_address: {
                              ...prev.shipping_address,
                              postcode: value,
                            },
                          }
                        : prev
                    );
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40"
                  placeholder="Enter ZIP Code"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Country
                </label>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 w-full">
                  <div className="w-6 h-4 rounded-sm overflow-hidden border border-gray-300">
                    <svg viewBox="0 0 60 30" className="w-full h-full">
                      <clipPath id="s">
                        <path d="M0,0 v30 h60 v-30 z"/>
                      </clipPath>
                      <g clipPath="url(#s)">
                        <path d="M0,0 v30 h60 v-30 z" fill="#b22234"/>
                        <path d="M0,2 h60 M0,6 h60 M0,10 h60 M0,14 h60 M0,18 h60 M0,22 h60 M0,26 h60" stroke="#fff" strokeWidth="2"/>
                        <rect width="24" height="16" fill="#3c3b6e"/>
                      </g>
                    </svg>
                  </div>
                  <div className="text-sm text-slate-700 flex-1">United States</div>
                </div>
                <input
                  type="hidden"
                  value={bookForm.shipping_address.country_code}
                  readOnly
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Phone
              </label>

              <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-[#8C5AF2]/40">
                <div className="flex items-center gap-2 px-3 py-2 border-r border-slate-200 bg-slate-50">
                  <div className="w-5 h-3 rounded-sm overflow-hidden border border-gray-300">
                    <svg viewBox="0 0 60 30" className="w-full h-full">
                      <clipPath id="phone-s">
                        <path d="M0,0 v30 h60 v-30 z"/>
                      </clipPath>
                      <g clipPath="url(#phone-s)">
                        <path d="M0,0 v30 h60 v-30 z" fill="#b22234"/>
                        <path d="M0,2 h60 M0,6 h60 M0,10 h60 M0,14 h60 M0,18 h60 M0,22 h60 M0,26 h60" stroke="#fff" strokeWidth="2"/>
                        <rect width="24" height="16" fill="#3c3b6e"/>
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
                        ? {
                            ...prev,
                            shipping_address: {
                              ...prev.shipping_address,
                              phone_number: raw,
                            },
                          }
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

        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-lg font-semibold text-slate-900">
              ${calcTotal(bookForm).toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Includes story printing +{" "}
              {SHIPPING_PRICES[bookForm.shipping].label} shipping.
            </p>
          </div>
        </div>

        <button
          className="w-full h-11 rounded-xl bg-[#8C5AF2] text-white font-semibold hover:bg-[#7C4AE8] transition disabled:opacity-60"
          disabled={!isAddressValid(bookForm.shipping_address)}
          onClick={handleCheckout}
        >
          Continue to payment
        </button>
      </div>
    </Modal>
  );
};

export default BookCustomizationModal;