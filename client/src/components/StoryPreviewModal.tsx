import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAuthSession } from "aws-amplify/auth";

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
}

const StoryPreviewModal: React.FC<StoryPreviewModalProps> = ({
  isOpen,
  onClose,
  modalStory,
  modalLoading,
  currentPage,
  setCurrentPage,
}) => {
  // Add edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [localModalStory, setLocalModalStory] = useState<StoryDetails | null>(modalStory);
  const [editData, setEditData] = useState({
    title: "",
    author: "",
    text: "",
    imageDescription: "",
  });

  // Update local story state when modalStory changes
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

  const getCurrentPageText = () => {
    if (currentPage === 0 && frontCover) {
      const titleFromPages = pages.find((p) => p.title)?.title;
      const authorFromPages = pages.find((p) => p.author)?.author;
      return {
        title: titleFromPages,
        author: authorFromPages,
      };
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

    if (pageData) {
      return pageData.text || pageData.content || null;
    }

    return null;
  };

  const getCurrentPageContent = () => {
    if (currentPage === 0 && frontCover) {
      const description =
        localModalStory?.imagePrompt ||
        frontCover.imagePrompt ||
        "No description available";
      return `${description}`;
    }

    if (currentPage === totalPages - 1 && backCover) {
      return (
        backCover.imagePrompt ||
        "A beautiful back cover design featuring elements from the story. The artwork captures the essence of the adventure and serves as a perfect conclusion to this magical tale."
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
      return frontCover.imageUrl || localModalStory?.coverImageUrl;
    }

    if (currentPage === totalPages - 1 && backCover) {
      return backCover.imageUrl || localModalStory?.coverImageUrl;
    }

    const pageIndex = currentPage - (frontCover ? 1 : 0);
    const pageData = storyPages[pageIndex];
    return pageData?.imageUrl || localModalStory?.coverImageUrl;
  };

  useEffect(() => {
    if (localModalStory && !modalLoading) {
      const currentPageData = getCurrentPageData();
      setEditData({
        title: currentPageData?.title || localModalStory?.title || "",
        author:
          currentPageData?.author || localModalStory?.author || "Created by StoryForge",
        text: currentPageData?.text || currentPageData?.content || "",
        imageDescription: currentPageData?.imagePrompt || "",
      });
    }
  }, [currentPage, localModalStory, modalLoading]);

  // Get current page data
  const getCurrentPageData = () => {
    if (currentPage === 0 && frontCover) return frontCover;
    if (currentPage === totalPages - 1 && backCover) return backCover;

    const pageIndex = currentPage - (frontCover ? 1 : 0);
    return storyPages[pageIndex];
  };

  // Get page number for API
  const getCurrentPageNumber = () => {
    if (currentPage === 0 && frontCover) return 0; // Front cover
    if (currentPage === totalPages - 1 && backCover) return totalPages - 1; // Back cover

    const pageIndex = currentPage - (frontCover ? 1 : 0);
    return pageIndex + 1; // Regular pages start from 1
  };

  const storyIdFromPages = pages.find((p) => p.storyId)?.storyId;

  const handleEditStory = async () => {
    if (!localModalStory) return;

    try {
      setEditLoading(true);

      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();

      if (!token) {
        alert("Please login first");
        return;
      }

      const pageNo = getCurrentPageNumber();

      const response = await fetch(
        `https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/stories/${storyIdFromPages}/page/${pageNo}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editData.title,
            author: editData.author,
            text: editData.text,
            imageDescription: editData.imageDescription,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Edit failed: ${response.status}`);
      }

      const updatedData = await response.json();
      console.log("Story updated successfully:", updatedData);

      // Update local story state with new data
      const updatedStory = { ...localModalStory };
      const currentPageData = getCurrentPageData();
      
      if (currentPageData) {
        // Update the current page with new data
        const pageIndex = pages.findIndex(p => p === currentPageData);
        if (pageIndex !== -1) {
          updatedStory.pages![pageIndex] = {
            ...currentPageData,
            title: editData.title,
            author: editData.author,
            text: editData.text,
            content: editData.text,
            imagePrompt: editData.imageDescription,
          };
        }
      }

      // Update local state
      setLocalModalStory(updatedStory);

      // Show success message
      alert("Story updated successfully!");

      // Close edit mode
      setIsEditing(false);

    } catch (error: any) {
      console.error("Edit story error:", error);
      alert(`Failed to update story: ${error.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderPageText = () => {
    const pageText = getCurrentPageText();

    if (currentPage === 0 && frontCover) {
      const titleFromPages = pages.find((p) => p.title)?.title;
      const authorFromPages = pages.find((p) => p.author)?.author;

      const finalTitle = titleFromPages;
      const author = authorFromPages;

      return (
        <div className="mb-6">
          <h3 className="text-lg font-story md:text-xl font-semibold text-gray-900 mb-4">
            Story Information
          </h3>
          {modalLoading ? (
            <div className="rounded-[20px] bg-gray-200 w-[570px] p-4 animate-pulse">
              <div className="w-[515px] space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-12 bg-gray-300 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-300 rounded animate-pulse" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                  <div className="h-4 w-40 bg-gray-300 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[20px] bg-[#EFEFEF] text-[#616161] leading-relaxed w-[570px] p-4">
              <div className="w-[515px] space-y-3">
                <div>
                  <span className="text-[14px] font-bold text-[#333333]">Title: </span>
                  <span className="text-[16px] font-semibold text-[#8C5AF2]">
                    {finalTitle}
                  </span>
                </div>
                <div>
                  <span className="text-[14px] font-bold text-[#333333]">Author: </span>
                  <span className="text-[14px] font-medium text-[#616161]">
                    {author}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (pageText && typeof pageText === "string") {
      return (
        <div className="mb-6">
          <h3 className="text-lg font-story md:text-xl font-semibold text-gray-900 mb-4">
            {currentPage === totalPages - 1
              ? "Back Cover Content"
              : "Story Content"}
          </h3>
          {modalLoading ? (
            <div className="rounded-[20px] bg-gray-200 w-[570px] p-4 animate-pulse">
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-300 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-gray-300 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-300 rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-gray-300 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="rounded-[20px] bg-[#EFEFEF] text-[#616161] leading-relaxed w-[570px] p-4">
              <p className="whitespace-pre-line w-[515px] text-[14px] font-medium">
                {pageText}
              </p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderEditForm = () => {
    if (!isEditing) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-story md:text-xl font-semibold text-gray-900 mb-4">
          Edit Story Content
        </h3>
        <div className="rounded-[20px] bg-[#F8F9FA] border border-[#E5E5E5] w-[570px] p-4 space-y-4">
          {/* Title Input */}
          <div>
            <label className="text-[14px] font-bold text-[#333333] block mb-2">
              Title:
            </label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full p-2 border border-[#E5E5E5] rounded-[8px] text-[14px] focus:outline-none focus:border-[#8C5AF2]"
              placeholder="Enter story title"
            />
          </div>

          {/* Author Input */}
          <div>
            <label className="text-[14px] font-bold text-[#333333] block mb-2">
              Author:
            </label>
            <input
              type="text"
              value={editData.author}
              onChange={(e) => handleInputChange("author", e.target.value)}
              className="w-full p-2 border border-[#E5E5E5] rounded-[8px] text-[14px] focus:outline-none focus:border-[#8C5AF2]"
              placeholder="Enter author name"
            />
          </div>


          {/* Image Description Input */}
          <div>
            <label className="text-[14px] font-bold text-[#333333] block mb-2">
              Image Description:
            </label>
            <textarea
              value={editData.imageDescription}
              onChange={(e) => handleInputChange("imageDescription", e.target.value)}
              rows={3}
              className="w-full p-2 border border-[#E5E5E5] rounded-[8px] text-[14px] focus:outline-none focus:border-[#8C5AF2] resize-none"
              placeholder="Describe the image for this page"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleEditStory}
              disabled={editLoading}
              className="px-4 py-2 bg-[#8C5AF2] text-white text-[14px] font-semibold rounded-[8px] hover:bg-[#7C4AE8] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={editLoading}
              className="px-4 py-2 border border-[#E5E5E5] text-[#333333] text-[14px] font-medium rounded-[8px] hover:bg-[#F8F9FA] transition disabled:opacity-50"
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
      onClose={onClose}
      title={modalLoading ? "Loading..." : getPageTitle()}
      maxWidth="max-w-[1284px]"
    >
      <div className="flex flex-wrap justify-center :justify-normal gap-8 px-8 py-6">
        <div>
          {modalLoading ? (
            <div className="space-y-6">
              {/* Story Information Loading */}
              <div className="space-y-3">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="rounded-[20px] bg-gray-200 w-[570px] p-4 animate-pulse">
                  <div className="w-[515px] space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-12 bg-gray-300 rounded animate-pulse" />
                      <div className="h-4 w-32 bg-gray-300 rounded animate-pulse" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                      <div className="h-4 w-40 bg-gray-300 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Loading */}
              <div className="space-y-3">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="rounded-[20px] bg-gray-200 w-[570px] p-4 animate-pulse">
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-300 rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-gray-300 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-300 rounded animate-pulse" />
                    <div className="h-3 w-5/6 bg-gray-300 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-gray-300 rounded animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Edit Story Button Loading */}
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <>
              {isEditing ? renderEditForm() : renderPageText()}

              <div>
                <h3 className="text-lg font-story md:text-xl font-semibold text-gray-900 mb-4">
                  {currentPage === 0
                    ? "Front Cover Description"
                    : currentPage === totalPages - 1
                    ? "Back Cover Description"
                    : "Image Description"}
                </h3>
                {modalLoading ? (
                  <div className="rounded-[20px] bg-gray-200 w-[570px] p-4 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-gray-300 rounded animate-pulse" />
                      <div className="h-3 w-3/4 bg-gray-300 rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-gray-300 rounded animate-pulse" />
                      <div className="h-3 w-5/6 bg-gray-300 rounded animate-pulse" />
                      <div className="h-3 w-2/3 bg-gray-300 rounded animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[20px] bg-[#EFEFEF] text-[#616161] leading-relaxed w-[570px] p-4 shadow-inner">
                    <p className="whitespace-pre-line w-[515px] text-[14px]">
                      {getCurrentPageContent()}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={editLoading}
                  className="inline-flex h-10 items-center px-4 rounded-md bg-[#8C5AF2] text-white text-sm font-semibold hover:bg-[#7C4AE8] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? "Cancel Edit" : "Edit Story"}
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
