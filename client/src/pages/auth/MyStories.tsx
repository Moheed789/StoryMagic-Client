"use client";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import DeleteStoryModal from "../../components/DeleteStoryModal";
import StoryPreviewModal from "../../components/StoryPreviewModal";
import { Check, Trash, X } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
// @ts-ignore: No types available for mockData.js
import { US_STATES, MAJOR_US_CITIES } from "../../utils/mockData";

type Story = {
  storyId: string;
  title: string;
  status?: string;
  totalPages?: number;
  coverImageUrl?: string | null;
  downloadHistory?: Array<{
    downloadOption: string;
    status: string;
    downloadable: string;
  }>;
  downloadable?: string;
  downloadOption?: string;
  downloadStatus?: string;
};

type StoryPage = {
  pageNumber?: number;
  text?: string;
  content?: string;
  imageUrl?: string;
  imagePrompt?: string;
  pageId?: string;
  storyId?: string;
  type?: string;
  title?: string;
  author?: string;
};

type StoryDetails = {
  storyId: string;
  title: string;
  imagePrompt?: string;
  status: string;
  totalPages: number;
  coverImageUrl?: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
  pages?: StoryPage[];
  author?: string;
};

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

const MyStories: React.FC = () => {
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStory, setModalStory] = useState<StoryDetails | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<{
    [storyId: string]: { pdf?: boolean; book?: boolean };
  }>({});
  const [selectedDownloadOption, setSelectedDownloadOption] = useState<{
    [storyId: string]: "pdf_only" | "pdf_and_book";
  }>({});
  const [showBookFormFor, setShowBookForm] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState<BookPurchaseForm | null>(null);

  useEffect(() => {
    const loadStories = async () => {
      try {
        const session: any = await fetchAuthSession();
        const token = session?.tokens?.idToken?.toString();

        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/stories`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch stories");
        const data = await res.json();

        if (data?.stories && Array.isArray(data.stories)) {
          setStories(data.stories);
        } else if (Array.isArray(data)) {
          setStories(data);
        } else {
          setStories([]);
        }
      } catch (err: any) {
        setError(err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, []);

  const openBookForm = async (story: Story) => {
    let finalPages =
      story.totalPages && story.totalPages > 0 ? story.totalPages : 0;

    if (!finalPages) {
      try {
        const session: any = await fetchAuthSession();
        const token = session?.tokens?.idToken?.toString();

        const res = await fetch(
          `${import.meta.env.VITE_BASE_URL}/stories/${story.storyId}`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data?.totalPages && data.totalPages > 0) {
            finalPages = data.totalPages;
          } else if (Array.isArray(data?.pages)) {
            finalPages = data.pages.length;
          }
        }
      } catch (err) {
        console.error("openBookForm detail fetch error", err);
      }
    }

    finalPages = finalPages - 2;
    if (finalPages < 1) {
      finalPages = 1;
    }

    let autoPage: "10" | "15" | "20" = "10";
    if (finalPages <= 10) autoPage = "10";
    else if (finalPages <= 15) autoPage = "15";
    else autoPage = "20";

    setShowBookForm(story.storyId);
    setBookForm({
      storyId: story.storyId,
      pageOption: autoPage,
      shipping: "standard",
      shipping_address: {
        name: "",
        street1: "",
        street2: "",
        city: "",
        state_code: "",
        postcode: "",
        country_code: "US",
        phone_number: "",
      },
    });
  };

  const handlePurchase = async (
    storyId: string,
    downloadOption: "pdf_only" | "pdf_and_book",
    extra?: {
      pageOption?: "10" | "15" | "20";
      shipping?: "standard" | "express";
      shipping_address?: ShippingAddress;
    }
  ) => {
    try {
      setPurchaseLoading((prev) => ({
        ...prev,
        [storyId]: {
          ...prev[storyId],
          [downloadOption === "pdf_only" ? "pdf" : "book"]: true,
        },
      }));

      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login first",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/stripe/story-download-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            storyId: storyId,
            downloadOption: downloadOption,
            bookConfig: {
              pageCount: extra?.pageOption
                ? Number(extra.pageOption)
                : undefined,
              pagePrice: extra?.pageOption
                ? PAGE_PRICES[extra.pageOption]
                : undefined,
              shippingMethod: extra?.shipping,
              shippingPrice: extra?.shipping
                ? SHIPPING_PRICES[extra.shipping].price
                : undefined,
              shipping_address: extra?.shipping_address,
            },
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Purchase failed");

      const checkoutUrl =
        data.url ||
        data.sessionUrl ||
        data.checkout_url ||
        data.checkoutUrl ||
        data.session?.url;

      if (checkoutUrl) {
        localStorage.setItem(
          "pendingPurchase",
          JSON.stringify({
            storyId,
            downloadOption,
            timestamp: Date.now(),
          })
        );

        window.location.href = checkoutUrl;
      } else {
        toast({
          title: "Checkout Error",
          description: "Checkout URL not found",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: `Purchase failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setPurchaseLoading((prev) => ({
        ...prev,
        [storyId]: {
          ...prev[storyId],
          [downloadOption === "pdf_only" ? "pdf" : "book"]: false,
        },
      }));
    }
  };

  const handleBookCheckout = async (form: BookPurchaseForm) => {
    if (!form) return;

    try {
      setPurchaseLoading((prev) => ({
        ...prev,
        [form.storyId]: { ...prev[form.storyId], book: true },
      }));

      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login first",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        storyId: form.storyId,
        pageCount: Number(form.pageOption),
        shippingOption: form.shipping,
        totalPrice: Math.round(calcTotal(form) * 100),
        shippingAddress: {
          name: form.shipping_address.name,
          line1: form.shipping_address.street1,
          city: form.shipping_address.city,
          state: form.shipping_address.state_code,
          postalCode: form.shipping_address.postcode,
          country: form.shipping_address.country_code,
        },
      };

      const res = await fetch(
        "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/stripe/story-download-book",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to create checkout session");
      }

      const checkoutUrl =
        data.url ||
        data.sessionUrl ||
        data.checkout_url ||
        data.checkoutUrl ||
        data.session?.url;

      if (checkoutUrl) {
        localStorage.setItem(
          "pendingPurchase",
          JSON.stringify({
            storyId: form.storyId,
            downloadOption: "pdf_and_book",
            timestamp: Date.now(),
          })
        );
        window.location.href = checkoutUrl;
      } else {
        toast({
          title: "Checkout Error",
          description: "Checkout URL not found",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Checkout Failed",
        description: `Checkout failed: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setPurchaseLoading((prev) => ({
        ...prev,
        [form.storyId]: { ...prev[form.storyId], book: false },
      }));
    }
  };

  const handleDownload = async (
    storyId: string,
    downloadOption: "pdf_only" | "pdf_and_book"
  ) => {
    try {
      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login first",
          variant: "destructive",
        });
        return;
      }

      const story = stories.find((s) => s.storyId === storyId);
      if (!story) {
        toast({
          title: "Error",
          description: "Story not found",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/stories/${storyId}/export-pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        await response.text();
        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        const jsonData = await response.json();

        if (jsonData.downloadUrl || jsonData.url || jsonData.pdfUrl) {
          const downloadUrl =
            jsonData.downloadUrl || jsonData.url || jsonData.pdfUrl;

          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = `${
            story.title?.replace(/[^a-zA-Z0-9]/g, "_") || "Story"
          }_${downloadOption}.pdf`;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast({
            title: "Download Started",
            description: "Your story download has begun",
            variant: "default",
          });
          return;
        }
        throw new Error(jsonData.message || "No download URL provided");
      }

      if (contentType?.includes("application/pdf")) {
        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const filename = `${
          story.title?.replace(/[^a-zA-Z0-9]/g, "_") || "Story"
        }_${downloadOption}.pdf`;
        link.download = filename;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Download Complete",
          description: "Your story has been downloaded successfully",
          variant: "default",
        });
        return;
      }

      throw new Error("Unsupported response format");
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: `Download failed: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const isPurchased = (story: Story, option: "pdf_only" | "pdf_and_book") => {
    if (story.downloadHistory && Array.isArray(story.downloadHistory)) {
      const purchasedOption = story.downloadHistory.find(
        (item) =>
          item.downloadOption === option &&
          item.status === "paid" &&
          item.downloadable === "Yes"
      );
      if (purchasedOption) return true;
    }

    const isDownloadable = story.downloadable === "Yes";
    const isPaid = story.downloadStatus === "paid";
    const optionMatches = story.downloadOption === option;

    return isDownloadable && isPaid && optionMatches;
  };

  const isPurchaseLoading = (
    storyId: string,
    option: "pdf_only" | "pdf_and_book"
  ) => {
    return (
      purchaseLoading[storyId]?.[option === "pdf_only" ? "pdf" : "book"] ||
      false
    );
  };

  const openPreviewModal = async (storyId: string) => {
    setModalLoading(true);
    setIsModalOpen(true);
    setCurrentPage(0);

    try {
      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();

      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/stories/${storyId}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch story");
      const data = await res.json();
      setModalStory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalStory(null);
    setCurrentPage(0);
  };

  const openDeleteModal = (storyId: string, title: string) => {
    setStoryToDelete({ id: storyId, title });
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setStoryToDelete(null);
  };

  const handleStoryDeleted = (deletedStoryId: string) => {
    setStories((prevStories) =>
      prevStories.filter((story) => story.storyId !== deletedStoryId)
    );
  };

  const handleDownloadOptionSelect = (
    storyId: string,
    option: "pdf_only" | "pdf_and_book"
  ) => {
    setSelectedDownloadOption((prev) => ({
      ...prev,
      [storyId]: option,
    }));
  };

  const getSelectedOption = (story: Story) => {
    const pdfPurchased = isPurchased(story, "pdf_only");
    const bookPurchased = isPurchased(story, "pdf_and_book");

    if (selectedDownloadOption[story.storyId]) {
      return selectedDownloadOption[story.storyId];
    }

    if (bookPurchased) return "pdf_and_book";
    if (pdfPurchased) return "pdf_only";

    return "pdf_only";
  };

  const handleStoryUpdate = (updatedStory: StoryDetails) => {
    setStories((prevStories) =>
      prevStories.map((story) =>
        story.storyId === updatedStory.storyId
          ? {
              ...story,
              title: updatedStory.title,
              coverImageUrl: updatedStory.coverImageUrl,
            }
          : story
      )
    );

    if (modalStory?.storyId === updatedStory.storyId) {
      setModalStory(updatedStory);
    }
  };

  const heading = useMemo(
    () => (
      <div className="text-center mb-8 md:mb-10 md:mt-[105px]">
        <h1 className="items-baseline text-[#24212C] font-display text-[40px] font-normal gap-2 md:text-[64px] tracking-tight">
          Your Magical&nbsp;
          <span className="text-[#8C5AF2]">Stories</span>
        </h1>
        <p className="text-[#6F677E] font-[500] text-[24px] font-story mt-[16px]">
          Browse, download, or relive the stories you've created with AI.
        </p>
      </div>
    ),
    []
  );

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

  if (loading) {
    return (
      <div className="max-w-[1579px] mx-auto px-4 py-10">
        {heading}
        <div className="flex flex-wrap gap-[44px] justify-center md:justify-start">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse"
            >
              <div className="bg-slate-200 aspect-[16/9]" />
              <div className="p-4">
                <div className="h-5 w-40 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-56 bg-slate-200 rounded mb-4" />
                <div className="h-10 w-full bg-slate-200 rounded mb-2" />
                <div className="h-10 w-full bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1579px] mx-auto px-4 py-10">
        {heading}
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1619px] mx-auto px-4 py-10">
      {heading}

      {stories.length === 0 ? (
        <p className="text-center text-slate-500">No stories found.</p>
      ) : (
        <div className="flex flex-wrap gap-[44px] justify-center xl:justify-start">
          {stories.map((story) => {
            const pdfPurchased = isPurchased(story, "pdf_only");
            const bookPurchased = isPurchased(story, "pdf_and_book");
            const pdfLoading = isPurchaseLoading(story.storyId, "pdf_only");
            const bookLoading = isPurchaseLoading(
              story.storyId,
              "pdf_and_book"
            );
            const selectedOption = getSelectedOption(story);

            return (
              <div
                key={story.storyId}
                className="rounded-[20px] border border-[#CCD8D3] bg-[#F4F3F7] w-[497px] shadow-sm overflow-hidden relative"
              >
                <div className="relative w-full overflow-hidden rounded-2xl">
                  <div className="relative h-[340px] w-full">
                    <img
                      src={story.coverImageUrl || "/placeholder-cover.jpg"}
                      alt={story.title}
                      className="absolute inset-0 w-full h-full object-cover object-top"
                    />
                    <button
                      onClick={() =>
                        openDeleteModal(
                          story.storyId,
                          story.title || "Untitled Story"
                        )
                      }
                      className="absolute bottom-3 right-3 w-6 h-6 bg-white text-[#FF383C] rounded-[6px] flex items-center justify-center text-sm font-bold z-10"
                      title="Delete Story"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-[24px] font-bold font-display text-[#333333] mb-4 leading-tight">
                    {story.title}
                  </h3>

                  <p className="text-[14px] text-[#8C5AF2] italic mb-4 font-medium">
                    Select Download Option
                  </p>

                  <div className="space-y-3 mb-6">
                    {/* PDF ONLY */}
                    <div
                      onClick={() =>
                        pdfPurchased &&
                        handleDownloadOptionSelect(story.storyId, "pdf_only")
                      }
                      className={`flex items-center justify-between p-4 border rounded-[12px] transition-colors cursor-pointer ${
                        pdfPurchased && selectedOption === "pdf_only"
                          ? "border-[#8C5AF2] bg-[#F8F6FF]"
                          : pdfPurchased
                          ? "border-[#E5E5E5] bg-white hover:border-[#8C5AF2]/50"
                          : "border-[#E5E5E5] bg-white cursor-default"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <span className="text-[14px] text-[#333333] font-medium">
                            Downloadable PDF Only .
                          </span>
                          <span className="text-[14px] font-bold text-[#8C5AF2] ml-1">
                            $2.99
                          </span>
                        </div>
                      </div>

                      <div>
                        {pdfPurchased ? (
                          <span className="text-[#28A745] flex items-center gap-[6px] text-[14px] font-semibold">
                            Purchased <Check size={14} />
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePurchase(story.storyId, "pdf_only");
                            }}
                            disabled={pdfLoading}
                            className="text-[#8C5AF2] underline text-[14px] font-medium transition hover:text-[#7C4AE8] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {pdfLoading ? "Processing..." : "Buy Now"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* PDF + BOOK */}
                    <div
                      onClick={() =>
                        bookPurchased &&
                        handleDownloadOptionSelect(
                          story.storyId,
                          "pdf_and_book"
                        )
                      }
                      className={`flex items-center justify-between p-4 border rounded-[12px] transition-colors cursor-pointer ${
                        bookPurchased && selectedOption === "pdf_and_book"
                          ? "border-[#8C5AF2] bg-[#F8F6FF]"
                          : bookPurchased
                          ? "border-[#E5E5E5] bg-white hover:border-[#8C5AF2]/50"
                          : "border-[#E5E5E5] bg-white cursor-default"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 w-full max-w-[249px]">
                          <span className="text-[14px] text-[#333333] font-medium">
                            Downloadable PDF + Professionally Printed Book
                          </span>
                          <span className="text-[12px] text-slate-500 block mt-1">
                            Choose pages and shipping on checkout.
                          </span>
                        </div>
                      </div>

                      <div>
                        {bookPurchased ? (
                          <span className="text-[#28A745] flex items-center gap-[6px] text-[14px] font-semibold">
                            Purchased <Check size={14} />
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void openBookForm(story);
                            }}
                            disabled={bookLoading}
                            className="text-[#8C5AF2] underline text-[14px] font-medium transition hover:text-[#7C4AE8] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {bookLoading ? "Processing..." : "Buy Now"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {!pdfPurchased && !bookPurchased && (
                    <p className="text-[14px] text-[#8C5AF2] italic mb-6 font-medium">
                      Purchase required to download
                    </p>
                  )}

                  {(pdfPurchased || bookPurchased) && (
                    <p className="text-[14px] text-[#8C5AF2] italic mb-6 font-medium">
                      {selectedOption === "pdf_and_book"
                        ? "Download PDF + Printed Book"
                        : "Download PDF Only"}
                    </p>
                  )}

                  <div className="space-y-3">
                    <button
                      onClick={() =>
                        handleDownload(story.storyId, selectedOption)
                      }
                      disabled={!pdfPurchased && !bookPurchased}
                      className="w-full h-[48px] rounded-[12px] bg-[#8C5AF2] text-white text-[16px] font-semibold hover:bg-[#7C4AE8] transition disabled:bg-[#CCCCCC] disabled:cursor-not-allowed"
                    >
                      {!pdfPurchased && !bookPurchased
                        ? "Purchase Required"
                        : "Download"}
                    </button>

                    <button
                      onClick={() => openPreviewModal(story.storyId)}
                      className="w-full h-10 rounded-md text-[#8C5AF2] text-[16px] font-semibold hover:bg-violet-200 transition"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STORY PREVIEW */}
      <StoryPreviewModal
        isOpen={isModalOpen}
        onClose={closeModal}
        modalStory={modalStory}
        modalLoading={modalLoading}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onStoryUpdate={handleStoryUpdate}
      />

      {/* DELETE MODAL */}
      <DeleteStoryModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        storyId={storyToDelete?.id || ""}
        storyTitle={storyToDelete?.title || ""}
        onDelete={handleStoryDeleted}
      />

      {/* BOOK PURCHASE FORM MODAL */}
      {showBookFormFor && bookForm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[580px] rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Customize your printed book
                </h2>
                <p className="text-sm text-slate-500">
                  Pick pages, shipping, and delivery address.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBookForm(null);
                  setBookForm(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="pb-5 space-y-5">
              {/* Pages */}
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

              {/* Shipping method */}
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

              {/* ADDRESS SECTION */}
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
                        onChange={(e) =>
                          setBookForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  shipping_address: {
                                    ...prev.shipping_address,
                                    postcode: e.target.value,
                                  },
                                }
                              : prev
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40"
                        placeholder="Enter ZIP code"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">
                        Country
                      </label>
                      <input
                        type="text"
                        value={bookForm.shipping_address.country_code}
                        onChange={(e) =>
                          setBookForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  shipping_address: {
                                    ...prev.shipping_address,
                                    country_code: e.target.value,
                                  },
                                }
                              : prev
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40"
                        placeholder="US"
                        readOnly
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={bookForm.shipping_address.phone_number}
                      onChange={(e) =>
                        setBookForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                shipping_address: {
                                  ...prev.shipping_address,
                                  phone_number: e.target.value,
                                },
                              }
                            : prev
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5AF2]/40"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
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
                onClick={() => {
                  (async () => {
                    if (!bookForm) return;

                    if (!isAddressValid(bookForm.shipping_address)) {
                      toast({
                        title: "Address incomplete",
                        description: "Please fill all required fields.",
                        variant: "destructive",
                      });
                      return;
                    }

                    await handleBookCheckout(bookForm);
                    setShowBookForm(null);
                    setBookForm(null);
                  })();
                }}
              >
                Continue to payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyStories;
