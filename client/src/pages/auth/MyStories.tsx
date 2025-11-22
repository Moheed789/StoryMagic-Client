"use client";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import DeleteStoryModal from "../../components/DeleteStoryModal";
import StoryPreviewModal from "../../components/StoryPreviewModal";
import UnlockPreviewsModal from "../../components/UnlockPreviewsModal";
import BookCustomizationModal from "../../components/BookCustomizationModal";
import { Check, Trash, Loader } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading";

type Story = {
  storyId: string;
  title: string;
  status?: string;
  totalPages?: number;
  coverImageUrl?: string | null;
  previewCount?: number;
  downloadHistory?: Array<{
    downloadOption: string;
    status: string;
    downloadable: string;
  }>;
  downloadable?: string;
  downloadOption?: string;
  downloadStatus?: string;
  deliveryStatus?: string;
  shippingMethod?: "standard" | "express";
  expectedDeliveryDate?: string | number;
  regenerationLimit?: number;
  regenerationRemaining?: number;
  regenerationUsed?: number;
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
  authorName?: string;
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
  authorName?: string;
  regenerationLimit?: number;
  regenerationRemaining?: number;
  regenerationUsed?: number;
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
  const [downloadLoading, setDownloadLoading] = useState<{
    [storyId: string]: boolean;
  }>({});
  const [selectedDownloadOption, setSelectedDownloadOption] = useState<{
    [storyId: string]: "pdf_only" | "pdf_and_book";
  }>({});

  const [storyPreviewCounts, setStoryPreviewCounts] = useState<{
    [storyId: string]: number;
  }>({});

  const [previewsPurchased, setPreviewsPurchased] = useState<{
    [storyId: string]: boolean;
  }>({});
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [unlockModalStoryId, setUnlockModalStoryId] = useState<string>("");
  const [showBookFormFor, setShowBookForm] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState<BookPurchaseForm | null>(null);

  const updatePreviewCount = async (storyId: string, userId: string) => {
    try {
      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();

      const res = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/stories/${storyId}/preview-count?userId=${userId}`,
        {
          method: "PUT",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        return data.previewCount || 0;
      }
      return null;
    } catch (err) {
      console.error("Failed to update preview count", err);
      return null;
    }
  };

  const markPreviewPurchased = (storyId: string) => {
    const updatedPurchases = { ...previewsPurchased, [storyId]: true };
    setPreviewsPurchased(updatedPurchases);
    localStorage.setItem("previewsPurchased", JSON.stringify(updatedPurchases));

    const updatedCounts = { ...storyPreviewCounts };
    delete updatedCounts[storyId];
    setStoryPreviewCounts(updatedCounts);
  };

  const refetchStories = async () => {
    try {
      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();

      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/stories`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStories(
          Array.isArray(data?.stories)
            ? data.stories
            : Array.isArray(data)
            ? data
            : []
        );
      }
    } catch {}
  };

  useEffect(() => {
    const loadStories = async () => {
      try {
        const session: any = await fetchAuthSession();
        const token = session?.tokens?.idToken?.toString();
        const userId = session?.tokens?.idToken?.payload?.sub;

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

          const counts: { [key: string]: number } = {};
          for (const story of data.stories) {
            counts[story.storyId] = story.previewCount ?? 3;
          }
          setStoryPreviewCounts(counts);
        } else if (Array.isArray(data)) {
          setStories(data);
          const counts: { [key: string]: number } = {};
          for (const story of data) {
            counts[story.storyId] = story.previewCount ?? 3;
          }
          setStoryPreviewCounts(counts);
        } else {
          setStories([]);
        }

        const savedPurchased = localStorage.getItem("previewsPurchased");
        if (savedPurchased) {
          try {
            const parsed = JSON.parse(savedPurchased);
            if (parsed && typeof parsed === "object")
              setPreviewsPurchased(parsed);
          } catch {
            localStorage.removeItem("previewsPurchased");
            setPreviewsPurchased({});
          }
        }
      } catch (err: any) {
        setError(err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, []);
  useEffect(() => {
    const verifyUnlockIfNeeded = async () => {
      try {
        const pendingRaw = localStorage.getItem("pendingPreviewUnlock");
        const pending = pendingRaw ? JSON.parse(pendingRaw) : null;

        const url = new URL(window.location.href);
        const previewUnlock = url.searchParams.get("preview_unlock");
        const sessionIdFromUrl = url.searchParams.get("session_id");

        const sessionId = sessionIdFromUrl || pending?.sessionId;
        const storyId = pending?.storyId;

        if (!sessionId || !storyId) return;

        const session: any = await fetchAuthSession();
        const token = session?.tokens?.idToken?.toString();
        if (!token) return;

        const res = await fetch(
          `${
            import.meta.env.VITE_BASE_URL
          }/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`,
          { method: "GET", headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Verification failed");

        const isPaid =
          data.paid === true ||
          data.payment_status === "paid" ||
          data.status === "complete" ||
          data.session?.payment_status === "paid";

        if (isPaid) {
          markPreviewPurchased(storyId);
          toast({
            title: "Unlocked",
            description: "Previews purchased successfully",
          });
        }

        localStorage.removeItem("pendingPreviewUnlock");
        if (previewUnlock || sessionIdFromUrl) {
          url.searchParams.delete("preview_unlock");
          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
        }
      } catch (err) {
        console.error("Preview unlock verification error", err);
      }
    };

    verifyUnlockIfNeeded();
  }, []);

  useEffect(() => {
    const verifyPendingPurchase = async () => {
      try {
        const url = new URL(window.location.href);
        const sessionId = url.searchParams.get("session_id");
        if (!sessionId) return;

        const pendingRaw = localStorage.getItem("pendingPurchase");
        if (!pendingRaw) return;

        const pending = JSON.parse(pendingRaw) as {
          storyId?: string;
          downloadOption?: "pdf_only" | "pdf_and_book";
          timestamp?: number;
        };
        if (!pending?.storyId) return;

        const session: any = await fetchAuthSession();
        const token = session?.tokens?.idToken?.toString();
        if (!token) return;

        const res = await fetch(
          `${
            import.meta.env.VITE_BASE_URL
          }/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Verification failed");

        const paid =
          data.paid === true ||
          data.payment_status === "paid" ||
          data.status === "complete" ||
          data.session?.payment_status === "paid";

        if (paid) {
          if (pending.downloadOption === "pdf_only") {
            markPreviewPurchased(pending.storyId!);
          }
          await refetchStories();
          toast({
            title: "Purchase complete",
            description: "Your purchase has been applied",
          });
        }

        localStorage.removeItem("pendingPurchase");
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url.toString());
      } catch (err) {
        console.error("verifyPendingPurchase error", err);
      }
    };

    verifyPendingPurchase();
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
          if (data?.totalPages && data.totalPages > 0)
            finalPages = data.totalPages;
          else if (Array.isArray(data?.pages)) finalPages = data.pages.length;
        }
      } catch (err) {
        console.error("openBookForm detail fetch error", err);
      }
    }

    finalPages = finalPages - 2;
    if (finalPages < 1) finalPages = 1;

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
            storyId,
            downloadOption,
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
          phone: form.shipping_address.phone_number,
        },
      };
      console.log("Book purchase payload:", payload);
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/stripe/story-download-book`,
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
      if (!res.ok)
        throw new Error(data.message || "Failed to create checkout session");

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
    setDownloadLoading((prev) => ({ ...prev, [storyId]: true }));

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
        const downloadUrl =
          jsonData.downloadUrl || jsonData.url || jsonData.pdfUrl;

        if (downloadUrl) {
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
          });
          setDownloadLoading((prev) => ({ ...prev, [storyId]: false }));
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
        });
        setDownloadLoading((prev) => ({ ...prev, [storyId]: false }));
        return;
      }

      throw new Error("Unsupported response format");
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: `Download failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setDownloadLoading((prev) => ({ ...prev, [storyId]: false }));
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

  const hasUnlimitedPreviews = (storyId: string) => {
    const story = stories.find((s) => s.storyId === storyId);
    const unlockedByLocal = previewsPurchased[storyId] === true;
    if (!story) return unlockedByLocal;

    const unlockedByPurchase =
      isPurchased(story, "pdf_only") || isPurchased(story, "pdf_and_book");

    return unlockedByLocal || unlockedByPurchase;
  };

  const isPurchaseLoading = (
    storyId: string,
    option: "pdf_only" | "pdf_and_book"
  ) =>
    purchaseLoading[storyId]?.[option === "pdf_only" ? "pdf" : "book"] || false;

  // const openPreviewModal = async (storyId: string) => {
  //   const purchased = hasUnlimitedPreviews(storyId);
  //   const count = storyPreviewCounts[storyId] || 0;

  //   if (!purchased && count <= 0) {
  //     setUnlockModalStoryId(storyId);
  //     setShowUnlockModal(true);
  //     return;
  //   }

  //   setModalLoading(true);
  //   setIsModalOpen(true);
  //   setCurrentPage(0);

  //   try {
  //     const session: any = await fetchAuthSession();
  //     const token = session?.tokens?.idToken?.toString();
  //     const userId = session?.tokens?.idToken?.payload?.sub;

  //     const res = await fetch(
  //       `${import.meta.env.VITE_BASE_URL}/stories/${storyId}`,
  //       {
  //         headers: {
  //           ...(token ? { Authorization: `Bearer ${token}` } : {}),
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );

  //     if (!res.ok) throw new Error("Failed to fetch story");
  //     const data = await res.json();
  //     setModalStory(data);
  const openPreviewModal = async (storyId: string) => {
    const purchased = hasUnlimitedPreviews(storyId);
    const count = storyPreviewCounts[storyId] || 0;

    if (!purchased && count <= 0) {
      setUnlockModalStoryId(storyId);
      setShowUnlockModal(true);
      return;
    }

    setModalLoading(true);
    setIsModalOpen(true);
    setCurrentPage(0);

    try {
      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      const userId = session?.tokens?.idToken?.payload?.sub;

      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/stories/${storyId}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
        }
      );

      // if (!res.ok) throw new Error("Failed to fetch story");
      // const data = await res.json();
      // setModalStory(data);
      if (!res.ok) throw new Error("Failed to fetch story");
      const data = await res.json();

      // list se story nikaal lo
      const listStory = stories.find((s) => s.storyId === storyId);

      // backend detail + list waale regen fields merge
      const merged: StoryDetails = {
        ...data,
        regenerationLimit:
          data.regenerationLimit ?? listStory?.regenerationLimit,
        regenerationRemaining:
          data.regenerationRemaining ?? listStory?.regenerationRemaining,
        regenerationUsed: data.regenerationUsed ?? listStory?.regenerationUsed,
      };

      setModalStory(merged);

      if (!purchased && userId) {
        const newCount = await updatePreviewCount(storyId, userId);
        if (newCount !== null) {
          setStoryPreviewCounts((prev) => ({
            ...prev,
            [storyId]: newCount,
          }));
        }
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load story preview",
        variant: "destructive",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const getPreviewButtonState = (storyId: string) => {
    const purchased = hasUnlimitedPreviews(storyId);
    const count = storyPreviewCounts[storyId] || 0;

    if (purchased || count > 0) {
      return {
        text: "Preview",
        disabled: false,
        className:
          "w-full h-10 rounded-md text-[#8C5AF2] text-[16px] font-semibold hover:bg-violet-200 transition",
      };
    }

    return {
      text: "Preview",
      disabled: true,
      className:
        "w-full h-10 rounded-md text-slate-400 text-[16px] font-semibold cursor-not-allowed bg-slate-100",
    };
  };

  const getPreviewStatusText = (storyId: string) => {
    const purchased = hasUnlimitedPreviews(storyId);
    const count = storyPreviewCounts[storyId] || 0;

    if (purchased) {
      return (
        <div className="text-center mt-2">
          <span className="text-[14px] text-green-600 font-medium">
            Previews Purchased ✓
          </span>
        </div>
      );
    }

    if (count > 0) {
      return (
        <div>
          <p className="text-[14px] text-[#6F677E] flex items-center gap-2 justify-end">
            Free Previews:
            <span className="text-[#34C759] font-medium">{count} Left</span>
          </p>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[14px] text-red-500 font-medium">
            Limit Reached
          </span>
          <button
            onClick={() => {
              setUnlockModalStoryId(storyId);
              setShowUnlockModal(true);
            }}
            className="ml-2 text-[14px] text-[#8C5AF2] underline font-medium hover:text-[#7C4AE8]"
          >
            Unlock Previews
          </button>
        </div>
      </div>
    );
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
    setStories((prev) => prev.filter((s) => s.storyId !== deletedStoryId));
  };

  const handleDownloadOptionSelect = (
    storyId: string,
    option: "pdf_only" | "pdf_and_book"
  ) => {
    setSelectedDownloadOption((prev) => ({ ...prev, [storyId]: option }));
  };

  const getSelectedOption = (story: Story) => {
    const pdfPurchased = isPurchased(story, "pdf_only");
    const bookPurchased = isPurchased(story, "pdf_and_book");

    if (selectedDownloadOption[story.storyId])
      return selectedDownloadOption[story.storyId];
    if (bookPurchased) return "pdf_and_book";
    if (pdfPurchased) return "pdf_only";
    return "pdf_only";
  };

  const handleStoryUpdate = (updatedStory: StoryDetails) => {
    setStories((prev) =>
      prev.map((s) =>
        s.storyId === updatedStory.storyId
          ? {
              ...s,
              title: updatedStory.title,
              coverImageUrl: updatedStory.coverImageUrl,
            }
          : s
      )
    );
    if (modalStory?.storyId === updatedStory.storyId)
      setModalStory(updatedStory);
  };

  const heading = useMemo(
    () => (
      <div className="text-center mb-8 md:mb-10 mt-[15px]">
        <h1 className="items-baseline text-[#24212C] font-display text-[34px] font-normal gap-2 md:text-[64px] tracking-tight">
          Your Magical&nbsp;<span className="text-[#8C5AF2]">Stories</span>
        </h1>
        <p className="text-[#6F677E] font-[500] text-[18px] md:text-[24px] font-story mt-[16px]">
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

  if (loading) {
    return (
      <div className="max-w-[1579px] mx-auto px-4 py-10">
        {heading}
        <div className="flex flex-wrap gap-[44px] justify-center">
          <LoadingSpinner size="lg" />
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
            const previewButtonState = getPreviewButtonState(story.storyId);

            return (
              <div
                key={story.storyId}
                className="rounded-[20px] border border-[#CCD8D3] w-[497px] shadow-sm overflow-hidden relative bg-white"
              >
                <div className="relative w-full">
                  <div className="relative h-[340px] w-full rounded-[16px] overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center blur-2xl z-0"
                      style={{
                        backgroundImage: `url(${
                          story.coverImageUrl || "/placeholder-cover.jpg"
                        })`,
                        backgroundColor: "#00000047",
                      }}
                    />

                    {story.deliveryStatus === "PRINTING" && (
                      <button className="absolute bottom-3 left-5 flex items-center gap-1 bg-white px-4 py-1.5 rounded-full shadow-md border border-gray-200 z-20">
                        <span className="text-[12px] font-medium font-story text-[#24212C]">
                          Status:
                        </span>

                        <span
                          className={`text-[12px] font-bold font-story ${
                            story.deliveryStatus === "PRINTING"
                              ? "text-[#34C759]"
                              : story.deliveryStatus === "DELIVERED"
                              ? "text-green-600"
                              : "text-slate-500"
                          }`}
                        >
                          {story.deliveryStatus
                            ? story.deliveryStatus.charAt(0).toUpperCase() +
                              story.deliveryStatus.slice(1).toLowerCase()
                            : "Unknown"}
                        </span>
                      </button>
                    )}

                    <img
                      src={story.coverImageUrl || "/placeholder-cover.jpg"}
                      alt={story.title}
                      className="relative w-full h-full object-contain z-10"
                    />

                    <button
                      onClick={() =>
                        openDeleteModal(
                          story.storyId,
                          story.title || "Untitled Story"
                        )
                      }
                      className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm text-[#FF383C] rounded-[8px] flex items-center justify-center shadow-md hover:bg-white transition-all z-20"
                      title="Delete Story"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-3 md:p-6 ">
                  {story.expectedDeliveryDate && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[12px] font-medium font-story text-[#24212C]">
                        Expected Delivery:
                      </span>
                      <span className="text-[12px] font-bold font-story text-[#34C759]">
                        {new Date(
                          story.expectedDeliveryDate
                        ).toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  <h3 className="text-[24px] font-bold font-display text-[#333333] mb-4 leading-tight">
                    {story.title}
                  </h3>

                  <p className="text-[14px] text-[#8C5AF2] italic mb-4 font-medium">
                    Select Download Option
                  </p>

                  <div className="space-y-3 mb-6 ">
                    <div
                      onClick={() =>
                        pdfPurchased &&
                        handleDownloadOptionSelect(story.storyId, "pdf_only")
                      }
                      className={`flex items-center justify-between p-3 md:p-4 border rounded-[12px] transition-colors cursor-pointer  ${
                        pdfPurchased && selectedOption === "pdf_only"
                          ? "border-[#8C5AF2] bg-[#F8F6FF]"
                          : pdfPurchased
                          ? "border-[#E5E5E5] bg-white hover:border-[#8C5AF2]/50"
                          : "border-[#E5E5E5] bg-white cursor-default"
                      }`}
                    >
                      <div className="flex items-center space-x-3  ">
                        <div className="flex-1">
                          <span className="text-[12px] md:text-[14px] text-[#333333] font-medium">
                            Downloadable PDF Only.
                          </span>
                          <span className="text-[12px] md:text-[14px] font-bold text-[#8C5AF2] ml-1">
                            $2.99
                          </span>
                        </div>
                      </div>

                      <div>
                        {pdfPurchased ? (
                          <span className="text-[#28A745] flex items-center gap-[6px] text-[12px] md:text-[14px] font-semibold">
                            Purchased <Check size={14} />
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePurchase(story.storyId, "pdf_only");
                            }}
                            disabled={pdfLoading}
                            className="text-[#8C5AF2] underline text-[12px] md:text-[14px] font-medium transition hover:text-[#7C4AE8] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {pdfLoading ? "Processing..." : "Buy Now"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div
                      onClick={() =>
                        bookPurchased &&
                        handleDownloadOptionSelect(
                          story.storyId,
                          "pdf_and_book"
                        )
                      }
                      className={`flex items-center justify-between p-3 md:p-4 border rounded-[12px] transition-colors cursor-pointer ${
                        bookPurchased && selectedOption === "pdf_and_book"
                          ? "border-[#8C5AF2] bg-[#F8F6FF]"
                          : bookPurchased
                          ? "border-[#E5E5E5] bg-white hover:border-[#8C5AF2]/50"
                          : "border-[#E5E5E5] bg-white cursor-default"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 w-full max-w-[205px]">
                          <span className="text-[12px] md:text-[14px] text-[#333333] font-medium">
                            Downloadable PDF + Professionally Printed Book
                          </span>
                        </div>
                      </div>

                      <div>
                        {bookPurchased ? (
                          <span className="text-[#28A745] flex items-center gap-[6px] text-[12px] md:text-[14px] font-semibold">
                            Purchased <Check size={14} />
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void openBookForm(story);
                            }}
                            disabled={bookLoading}
                            className="text-[#8C5AF2] underline text-[12px] md:text-[14px] font-medium transition hover:text-[#7C4AE8] disabled:opacity-50 disabled:cursor-not-allowed"
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
                      disabled={
                        (!pdfPurchased && !bookPurchased) ||
                        downloadLoading[story.storyId]
                      }
                      className="w-full h-[48px] rounded-[12px] bg-[#8C5AF2] text-white text-[16px] font-semibold hover:bg-[#7C4AE8] transition disabled:bg-[#CCCCCC] disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {downloadLoading[story.storyId] ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          {!pdfPurchased && !bookPurchased
                            ? "Purchase Required"
                            : "Download"}
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => openPreviewModal(story.storyId)}
                      disabled={getPreviewButtonState(story.storyId).disabled}
                      className={getPreviewButtonState(story.storyId).className}
                    >
                      {getPreviewButtonState(story.storyId).text}
                    </button>

                    {getPreviewStatusText(story.storyId)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <StoryPreviewModal
        stories={stories}
        isOpen={isModalOpen}
        onClose={closeModal}
        modalStory={modalStory}
        modalLoading={modalLoading}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onStoryUpdate={handleStoryUpdate}
      />

      <DeleteStoryModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        storyId={storyToDelete?.id || ""}
        storyTitle={storyToDelete?.title || ""}
        onDelete={handleStoryDeleted}
      />

      <UnlockPreviewsModal
        isOpen={showUnlockModal}
        onClose={() => {
          setShowUnlockModal(false);
          setUnlockModalStoryId("");
        }}
        storyId={unlockModalStoryId}
      />

      <BookCustomizationModal
        isOpen={showBookFormFor !== null && bookForm !== null}
        onClose={() => {
          setShowBookForm(null);
          setBookForm(null);
        }}
        bookForm={bookForm}
        setBookForm={setBookForm}
        onCheckout={async (form) => {
          await handleBookCheckout(form);
          setShowBookForm(null);
          setBookForm(null);
        }}
      />
    </div>
  );
};

export default MyStories;
