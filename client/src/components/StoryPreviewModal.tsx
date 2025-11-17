import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useToast } from "@/hooks/use-toast";

const secureContentStyles: React.CSSProperties = {
  userSelect: "none",
  WebkitUserSelect: "none",
  msUserSelect: "none",
  WebkitTouchCallout: "none",
  pointerEvents: "none",
};

const secureImageStyles: React.CSSProperties = {
  userSelect: "none",
  WebkitUserSelect: "none",
  msUserSelect: "none",
  pointerEvents: "none",
  WebkitTouchCallout: "none",
  filter: "opacity(0.98)",
};

interface StoryPage {
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
}

interface StoryDetails {
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
}

interface StoryPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalStory: StoryDetails | null;
  modalLoading: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onStoryUpdate?: (updatedStory: StoryDetails) => void;
}

const StoryPreviewModal: React.FC<StoryPreviewModalProps> = ({
  isOpen,
  onClose,
  modalStory,
  modalLoading,
  currentPage,
  setCurrentPage,
  onStoryUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const [editLoading, setEditLoading] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);

  const isBusy = editLoading || imageGenerating;

  const [localModalStory, setLocalModalStory] = useState<StoryDetails | null>(
    modalStory
  );

  const [editData, setEditData] = useState({
    title: "",
    author: "",
    text: "",
  });

  useEffect(() => {
    setLocalModalStory(modalStory);
  }, [modalStory]);

  const pages = localModalStory?.pages || [];
  const sortedPages = pages.sort((a, b) => {
    if (a.type === "COVER_FRONT") return -1;
    if (b.type === "COVER_FRONT") return 1;
    if (a.type === "COVER_BACK") return 1;
    if (b.type === "COVER_BACK") return -1;
    return (a.pageNumber || 0) - (b.pageNumber || 0);
  });

  const frontCover = sortedPages.find((p) => p.type === "COVER_FRONT");
  const backCover = sortedPages.find((p) => p.type === "COVER_BACK");
  const storyPages = sortedPages.filter((p) => p.type === "PAGE");
  const totalPages =
    (frontCover ? 1 : 0) + storyPages.length + (backCover ? 1 : 0);

  const getPageTitle = () => {
    if (currentPage === 0 && frontCover) return "Front Cover";
    if (currentPage === totalPages - 1 && backCover) return "Back Cover";
    return `Page ${currentPage - (frontCover ? 0 : -1)}`;
  };

  const getCurrentPageData = () => {
    if (currentPage === 0 && frontCover) return frontCover;
    if (currentPage === totalPages - 1 && backCover) return backCover;
    const pageIndex = currentPage - (frontCover ? 1 : 0);
    return storyPages[pageIndex];
  };

  const getCurrentPageText = () => {
    if (currentPage === 0 && frontCover) {
      const titleFromPages = pages.find((p) => p.title)?.title;
      const authorFromPages = pages.find((p) => p.author)?.author;
      return { title: titleFromPages, author: authorFromPages };
    }
    if (currentPage === totalPages - 1 && backCover) {
      return (
        backCover.text ||
        backCover.content ||
        "The End\n\nThank you for reading this magical story!"
      );
    }
    const pageIndex = currentPage - (frontCover ? 1 : 0);
    const pageData = storyPages[pageIndex];
    return pageData?.text || pageData?.content || null;
  };

  const getCurrentPageImage = () => {
    if (currentPage === 0 && frontCover) {
      return frontCover.imageUrl || localModalStory?.coverImageUrl;
    }
    if (currentPage === totalPages - 1 && backCover) {
      return backCover.imageUrl || localModalStory?.coverImageUrl;
    }
    const pageIndex = currentPage - (frontCover ? 1 : 0);
    const pageData = storyPages[pageIndex];
    return pageData?.imageUrl || localModalStory?.coverImageUrl;
  };

  const getCurrentPageNumber = () => {
    if (currentPage === 0 && frontCover) return 0;
    if (currentPage === totalPages - 1 && backCover) return totalPages - 1;
    const pageIndex = currentPage - (frontCover ? 1 : 0);
    return pageIndex + 1;
  };

  useEffect(() => {
    if (localModalStory && !modalLoading) {
      const p = getCurrentPageData();
      setEditData({
        title: p?.title || localModalStory?.title || "",
        author: p?.author || localModalStory?.author || "",
        text: p?.text || p?.content || "",
      });
    }
  }, [currentPage, localModalStory, modalLoading]);

  const generateFrontCoverImage = async (
    storyId: string,
    pageNumber: number
  ) => {
    try {
      setImageGenerating(true);

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

      const generateResponse = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/stories/${storyId}/pages/${pageNumber}/generate-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!generateResponse.ok) {
        const data = await generateResponse.json();
        throw new Error(data.message);
      }

      let attempts = 0;
      const max = 30;

      const poll = async () => {
        if (attempts >= max) {
          toast({
            title: "Timeout",
            description: "Image generation took too long",
            variant: "destructive",
          });
          setImageGenerating(false);
          return;
        }

        attempts++;

        const statusResponse = await fetch(
          `${
            import.meta.env.VITE_BASE_URL
          }/stories/${storyId}/pages/${pageNumber}/image-status`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const status = await statusResponse.json();

        if (status.status === "COMPLETED" && status.imageUrl) {
          const updated = { ...localModalStory! };
          const frontIdx = pages.findIndex((p) => p.type === "COVER_FRONT");
          if (frontIdx !== -1) {
            updated.pages![frontIdx].imageUrl = status.imageUrl;
            updated.coverImageUrl = status.imageUrl;
          }
          setLocalModalStory(updated);
          if (onStoryUpdate) onStoryUpdate(updated);
          setImageGenerating(false);
        } else if (status.status === "FAILED") {
          toast({ title: "Failed", variant: "destructive" });
          setImageGenerating(false);
        } else {
          setTimeout(poll, 2000);
        }
      };

      setTimeout(poll, 2000);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      setImageGenerating(false);
    }
  };

  const handleEditStory = async () => {
    if (!localModalStory) return;

    try {
      setEditLoading(true);

      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      if (!token) return;

      const pageNo = getCurrentPageNumber();
      const isFront = currentPage === 0 && frontCover;

      const storyIdFromPages = pages.find((p) => p.storyId)?.storyId;
      if (!storyIdFromPages) return;

      let body;
      if (isFront) {
        body = { title: editData.title, author: editData.author };
      } else {
        body = { text: editData.text };
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/stories/${storyIdFromPages}/page/${pageNo}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) throw new Error("Update failed");

      const updated = { ...localModalStory };
      const pageData = getCurrentPageData();
      const index = pages.findIndex((p) => p === pageData);

      if (isFront) {
        updated.pages![index] = {
          ...pageData!,
          title: editData.title,
          author: editData.author,
        };
        updated.title = editData.title;
      } else {
        updated.pages![index] = {
          ...pageData!,
          text: editData.text,
          content: editData.text,
        };
      }

      setLocalModalStory(updated);
      if (onStoryUpdate) onStoryUpdate(updated);

      setIsEditing(false);

      if (isFront) {
        await generateFrontCoverImage(storyIdFromPages, pageNo);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const isFrontCover = currentPage === 0 && !!frontCover;
  const isBackCover = currentPage === totalPages - 1 && !!backCover;

  const renderPageText = () => {
    const pageText = getCurrentPageText();

    if (currentPage === 0 && frontCover) {
      const finalTitle = pages.find((p) => p.title)?.title;
      const author = pages.find((p) => p.author)?.author;

      return (
        <div className="mb-6">
          <h3 className="text-base md:text-lg font-story font-semibold text-gray-900 mb-3">
            Story Information
          </h3>
          <div className="rounded-[20px] bg-[#EFEFEF] text-[#616161] p-4">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-bold text-[#333333]">Title:</span>
                <span className="ml-2 text-base font-semibold text-[#8C5AF2]">
                  {finalTitle || "Untitled"}
                </span>
              </div>
              <div>
                <span className="text-sm font-bold text-[#333333]">
                  Author:
                </span>
                <span className="ml-2 text-sm">{author || "No author"}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (pageText && typeof pageText === "string") {
      return (
        <div className="mb-6">
          <h3 className="text-base md:text-lg font-story font-semibold mb-3">
            {isBackCover ? "Back Cover Content" : "Story Content"}
          </h3>
          <div className="rounded-[20px] bg-[#EFEFEF] text-[#616161] p-4">
            <p className="whitespace-pre-line text-sm md:text-base">
              {pageText}
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderEditForm = () => {
    if (!isEditing) return null;

    const isRegularPage = !isFrontCover && !isBackCover;

    return (
      <div className="mb-6">
        <h3 className="text-base md:text-lg font-story font-semibold mb-3">
          Edit Story Content
        </h3>

        <div className="rounded-[20px] bg-[#F8F9FA] border p-4 space-y-4">
          {isFrontCover && (
            <>
              <div>
                <label className="text-sm font-bold block mb-2">Title:</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  disabled={isBusy}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="text-sm font-bold block mb-2">Author:</label>
                <input
                  type="text"
                  value={editData.author}
                  onChange={(e) => handleInputChange("author", e.target.value)}
                  disabled={isBusy}
                  className="w-full p-2 border rounded"
                />
              </div>
            </>
          )}

          {(isRegularPage || isBackCover) && (
            <div>
              <label className="text-sm font-bold block mb-2">
                Story Text:
              </label>
              <textarea
                value={editData.text}
                onChange={(e) => handleInputChange("text", e.target.value)}
                disabled={isBusy}
                rows={6}
                className="w-full p-2 border rounded resize-none"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleEditStory}
              disabled={isBusy}
              className="px-4 py-2 bg-[#8C5AF2] text-white rounded disabled:opacity-50"
            >
              {editLoading
                ? "Saving..."
                : imageGenerating
                ? "Generating..."
                : "Save Changes"}
            </button>

            <button
              onClick={() => setIsEditing(false)}
              disabled={isBusy}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isBusy ? undefined : onClose}
      disableClose={isBusy}
      title={modalLoading ? "Loading..." : getPageTitle()}
      maxWidth="max-w-[95vw] md:max-w-5xl"
      className="max-h-[85vh] overflow-y-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8 py-6">
        <div className="order-2 md:order-1">
          {modalLoading ? (
            <div>Loading…</div>
          ) : (
            <>
              {isEditing ? renderEditForm() : renderPageText()}

              {!isFrontCover && !isBackCover && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isBusy}
                  className="mt-4 px-4 py-2 bg-[#8C5AF2] text-white rounded disabled:opacity-50"
                >
                  {isEditing ? "Cancel Edit" : "Edit Story"}
                </button>
              )}
            </>
          )}
        </div>

        <div className="order-1 md:order-2">
          <h3 className="text-base md:text-lg font-story font-semibold mb-3">
            Image Preview
          </h3>

          <div className="relative rounded-[20px] overflow-hidden">
            {getCurrentPageImage() ? (
              <>
                <img
                  src={getCurrentPageImage()!}
                  alt={getPageTitle()}
                  className={`w-full aspect-square object-cover rounded ${
                    imageGenerating ? "opacity-50" : "opacity-100"
                  }`}
                />

                {imageGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[20px]">
                    <div className="text-white text-sm">Generating...</div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full aspect-square bg-gray-100 flex items-center justify-center rounded-[20px]">
                No image available
              </div>
            )}
          </div>
        </div>
      </div>

      {!modalLoading && modalStory && totalPages > 0 && (
        <div className="w-full flex items-center justify-between px-8 mb-6">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0 || isBusy}
            className="text-sm inline-flex items-center gap-1 font-medium text-gray-500 hover:text-gray-700 disabled:text-[#999999] disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-sm text-gray-600">
            <span className="text-[#8C5AF2] font-semibold">
              {currentPage + 1}
            </span>
            <span className="mx-1">/</span>
            <span>{totalPages}</span>
          </div>

          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
            }
            disabled={currentPage === totalPages - 1 || isBusy}
            className="text-sm inline-flex items-center gap-1 font-semibold text-[#8C5AF2] hover:text-violet-700 disabled:text-[#999999] disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </Modal>
  );
};

export default StoryPreviewModal;
