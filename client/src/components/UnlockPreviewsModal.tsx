import React from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useToast } from "../hooks/use-toast";
import Modal from "./Modal";

interface UnlockPreviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  storyId: string;
}
const UnlockPreviewsModal: React.FC<UnlockPreviewsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  storyId,
}) => {
  const { toast } = useToast();
  const [unlockLoading, setUnlockLoading] = React.useState<boolean>(false);

  const handleUnlockPreviews = async () => {
    try {
      setUnlockLoading(true);

      // Add validation for storyId
      if (!storyId) {
        toast({
          title: "Error",
          description: "No story selected",
          variant: "destructive",
        });
        return;
      }

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
            downloadOption: "pdf_only",
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
          "pendingPreviewUnlock",
          JSON.stringify({
            timestamp: Date.now(),
          })
        );

        window.location.href = checkoutUrl;
        onSuccess?.();
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
      setUnlockLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-[500px]"
      showCloseButton={false}
    >
      <div className="p-8 text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#8C5AF2] mb-2">
            You've reached the end of your free previews
          </h2>
          <p className="text-slate-600">
            Unlock unlimited access and keep discovering magical stories!
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUnlockPreviews}
            disabled={unlockLoading}
            className="flex-1 h-12 rounded-xl bg-[#8C5AF2] text-white font-semibold hover:bg-[#7C4AE8] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {unlockLoading ? "Processing..." : "Buy Now"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UnlockPreviewsModal;