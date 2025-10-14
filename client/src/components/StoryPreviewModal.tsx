import React from "react";
import Modal from "./Modal";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StoryPage {
  pageNumber?: number;
  text?: string;
  content?: string;
  imageUrl?: string;
  imagePrompt?: string;
  createdAt?: number;
  pageId?: string;
  pk?: string;
  sk?: string;
  storyId?: string;
  type?: string;
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
}

interface StoryPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalStory: StoryDetails | null;
  modalLoading: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const StoryPreviewModal: React.FC<StoryPreviewModalProps> = ({
  isOpen,
  onClose,
  modalStory,
  modalLoading,
  currentPage,
  setCurrentPage,
}) => {
  const pages = modalStory?.pages || [];

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

  const getCurrentPageText = () => {
    if (currentPage === 0 && frontCover) return null;
    if (currentPage === totalPages - 1 && backCover) return null;

    const pageIndex = currentPage - (frontCover ? 1 : 0);
    const pageData = storyPages[pageIndex];

    if (pageData) {
      return pageData.text || pageData.content || null;
    }

    return null;
  };

  const getCurrentPageContent = () => {
    if (currentPage === 0 && frontCover) {
      const description =
        modalStory?.imagePrompt ||
        frontCover.imagePrompt ||
        "No description available";
      return `${description}`;
    }

    if (currentPage === totalPages - 1 && backCover) {
      return (
        backCover.imagePrompt ||
        backCover.content ||
        "The End\n\nThank you for reading this magical story!"
      );
    }

    const pageIndex = currentPage - (frontCover ? 1 : 0);
    const pageData = storyPages[pageIndex];
    if (pageData) {
      return pageData.imagePrompt || "No description available";
    }

    return "No content available";
  };

  const getCurrentPageImage = () => {
    if (currentPage === 0 && frontCover) {
      return frontCover.imageUrl || modalStory?.coverImageUrl;
    }

    if (currentPage === totalPages - 1 && backCover) {
      return backCover.imageUrl || modalStory?.coverImageUrl;
    }

    const pageIndex = currentPage - (frontCover ? 1 : 0);
    const pageData = storyPages[pageIndex];
    return pageData?.imageUrl || modalStory?.coverImageUrl;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalLoading ? "Loading..." : getPageTitle()}
      maxWidth="max-w-[1284px]"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8 py-6">
        <div>
          {modalLoading ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ) : (
            <>
              {getCurrentPageText() && (
                <div className="mb-6">
                  <h3 className="text-lg font-story md:text-xl font-semibold text-gray-900 mb-4">
                    Story Content
                  </h3>
                  <div className="rounded-[20px] bg-[#EFEFEF] text-[#616161] leading-relaxed w-[570px] p-4">
                    <p className="whitespace-pre-line w-[515px] text-[14px] font-medium">
                      {getCurrentPageText()}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-story md:text-xl font-semibold text-gray-900 mb-4">
                  {currentPage === 0
                    ? "Front Cover Description"
                    : currentPage === totalPages - 1
                    ? "Back Cover Description"
                    : "Image Description"}
                </h3>
                <div className="rounded-[20px] bg-[#EFEFEF] text-[#616161] leading-relaxed w-[570px] p-4 shadow-inner">
                  <p className="whitespace-pre-line w-[515px] text-[14px]">
                    {getCurrentPageContent()}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button className="inline-flex h-10 items-center px-4 rounded-md bg-[#8C5AF2] text-white text-sm font-semibold hover:bg-[#8C5AF2] transition">
                  Edit Story
                </button>
              </div>
            </>
          )}
        </div>

        <div>
          <h3 className="text-lg md:text-xl font-story font-semibold text-gray-900 mb-4">
            Image Preview
          </h3>
          {modalLoading ? (
            <div className="w-[560px] h-[560px] bg-gray-200 rounded-[20px] animate-pulse" />
          ) : (
            <div className="rounded-[20px] overflow-hidden">
              {getCurrentPageImage() ? (
                <img
                  src={getCurrentPageImage()}
                  alt={getPageTitle()}
                  className="w-[560px] h-[560px] object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.parentElement!.innerHTML =
                      '<div class="w-[560px] h-[560px] flex items-center justify-center text-gray-500 bg-gray-100 rounded-[20px]">Failed to load image</div>';
                  }}
                />
              ) : (
                <div className="w-[560px] h-[560px] flex items-center justify-center text-gray-500 bg-gray-100 rounded-[20px]">
                  No image available
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      {!modalLoading && modalStory && totalPages > 0 && (
        <div className="w-full max-w-[246px] flex items-center justify-between mx-auto mb-6">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="text-sm flex items-center font-medium text-gray-500 hover:text-gray-700 disabled:text-[#999999] disabled:cursor-not-allowed"
          >
            <ChevronLeft /> Back
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
            disabled={currentPage === totalPages - 1}
            className="text-sm font-semibold text-[#8C5AF2] hover:text-violet-700 disabled:text-[#999999] disabled:cursor-not-allowed flex items-center"
          >
            Next <ChevronRight />
          </button>
        </div>
      )}
    </Modal>
  );
};

export default StoryPreviewModal;
