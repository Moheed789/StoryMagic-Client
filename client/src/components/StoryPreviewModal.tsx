import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useToast } from "@/hooks/use-toast";

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
  onStoryUpdate?: (updatedStory: StoryDetails) => void; // Add this prop
}

const StoryPreviewModal: React.FC<StoryPreviewModalProps> = ({
  isOpen,
  onClose,
  modalStory,
  modalLoading,
  currentPage,
  setCurrentPage,
  onStoryUpdate, // Add this prop
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const [editLoading, setEditLoading] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [localModalStory, setLocalModalStory] = useState<StoryDetails | null>(modalStory);
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
  const totalPages = (frontCover ? 1 : 0) + storyPages.length + (backCover ? 1 : 0);

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
      return backCover.text || backCover.content || "The End\n\nThank you for reading this magical story!";
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
      const currentPageData = getCurrentPageData();
      setEditData({
        title: currentPageData?.title || localModalStory?.title || "",
        author: currentPageData?.author || localModalStory?.author || "",
        text: currentPageData?.text || currentPageData?.content || "",
      });
    }
  }, [currentPage, localModalStory, modalLoading]);

  const generateFrontCoverImage = async (storyId: string, pageNumber: number) => {
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
        `${import.meta.env.VITE_BASE_URL}/stories/${storyId}/pages/${pageNumber}/generate-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.message || "Failed to start image generation");
      }

      toast({
        title: "Image Generation Started",
        description: "Generating new front cover image...",
        variant: "default",
      });

      let attempts = 0;
      const maxAttempts = 30;
      
      const pollImageStatus = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          toast({
            title: "Generation Timeout",
            description: "Image generation is taking longer than expected. Please refresh to check status.",
            variant: "destructive",
          });
          setImageGenerating(false);
          return;
        }

        attempts++;

        try {
          const statusResponse = await fetch(
            `${import.meta.env.VITE_BASE_URL}/stories/${storyId}/pages/${pageNumber}/image-status`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!statusResponse.ok) {
            throw new Error("Failed to check image status");
          }

          const statusData = await statusResponse.json();
          
          if (statusData.status === "COMPLETED" && statusData.imageUrl) {
            const updatedStory = { ...localModalStory! };
            const frontCoverIndex = pages.findIndex(p => p.type === "COVER_FRONT");
            
            if (frontCoverIndex !== -1) {
              updatedStory.pages![frontCoverIndex] = {
                ...updatedStory.pages![frontCoverIndex],
                imageUrl: statusData.imageUrl,
              };
              
              // Also update coverImageUrl for story card
              updatedStory.coverImageUrl = statusData.imageUrl;
              
              setLocalModalStory(updatedStory);
              
              // Update parent component's story state
              if (onStoryUpdate) {
                onStoryUpdate(updatedStory);
              }
            }

            toast({
              title: "Image Generated Successfully",
              description: "Front cover image has been updated with new content!",
              variant: "default",
            });
            
            setImageGenerating(false);
          } else if (statusData.status === "FAILED") {
            toast({
              title: "Image Generation Failed",
              description: statusData.error || "Failed to generate new image",
              variant: "destructive",
            });
            setImageGenerating(false);
          } else {
            setTimeout(pollImageStatus, 2000);
          }
        } catch (error: any) {
          console.error("Error checking image status:", error);
          setTimeout(pollImageStatus, 2000); 
        }
      };

      setTimeout(pollImageStatus, 2000);

    } catch (error: any) {
      console.error("Image generation error:", error);
      toast({
        title: "Image Generation Failed",
        description: `Failed to generate image: ${error.message}`,
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

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login first",
          variant: "destructive",
        });
        return;
      }

      const pageNo = getCurrentPageNumber();
      const isFrontCover = currentPage === 0 && frontCover;
      const storyIdFromPages = pages.find((p) => p.storyId)?.storyId;

      if (!storyIdFromPages) {
        toast({
          title: "Error",
          description: "Story ID not found",
          variant: "destructive",
        });
        return;
      }

      let requestBody: any = {};
      if (isFrontCover) {
        requestBody = { title: editData.title, author: editData.author };
      } else {
        requestBody = { text: editData.text };
      }

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/stories/${storyIdFromPages}/page/${pageNo}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Edit failed: ${response.status}`);
      }

      const updatedStory = { ...localModalStory };
      const currentPageData = getCurrentPageData();
      
      if (currentPageData) {
        const pageIndex = pages.findIndex(p => p === currentPageData);
        if (pageIndex !== -1) {
          if (isFrontCover) {
            updatedStory.pages![pageIndex] = {
              ...currentPageData,
              title: editData.title,
              author: editData.author,
            };
            // Also update main story title
            updatedStory.title = editData.title;
          } else {
            updatedStory.pages![pageIndex] = {
              ...currentPageData,
              text: editData.text,
              content: editData.text,
            };
          }
        }
      }

      setLocalModalStory(updatedStory);
      
      // Update parent component's story state
      if (onStoryUpdate) {
        onStoryUpdate(updatedStory);
      }
      
      toast({
        title: "Success",
        description: "Story updated successfully!",
        variant: "default",
      });
      
      setIsEditing(false);

      if (isFrontCover) {
        await generateFrontCoverImage(storyIdFromPages, pageNo);
      }

    } catch (error: any) {
      console.error("Edit story error:", error);
      
      toast({
        title: "Update Failed",
        description: `Failed to update story: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const renderPageText = () => {
    const pageText = getCurrentPageText();

    if (currentPage === 0 && frontCover) {
      const finalTitle = pages.find((p) => p.title)?.title;
      const author = pages.find((p) => p.author)?.author;

      return (
        <div className="mb-6">
          <h3 className="text-lg font-story md:text-xl font-semibold text-gray-900 mb-4">
            Story Information
          </h3>
          <div className="rounded-[20px] bg-[#EFEFEF] text-[#616161] leading-relaxed w-[570px] p-4">
            <div className="w-[515px] space-y-3">
              <div>
                <span className="text-[14px] font-bold text-[#333333]">Title: </span>
                <span className="text-[16px] font-semibold text-[#8C5AF2]">
                  {finalTitle || "Untitled"}
                </span>
              </div>
              <div>
                <span className="text-[14px] font-bold text-[#333333]">Author: </span>
                <span className="text-[14px] font-medium text-[#616161]">
                  {author || "No author specified"}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (pageText && typeof pageText === "string") {
      return (
        <div className="mb-6">
          <h3 className="text-lg font-story md:text-xl font-semibold text-gray-900 mb-4">
            {currentPage === totalPages - 1 ? "Back Cover Content" : "Story Content"}
          </h3>
          <div className="rounded-[20px] bg-[#EFEFEF] text-[#616161] leading-relaxed w-[570px] p-4">
            <p className="whitespace-pre-line w-[515px] text-[14px] font-medium">
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

    const isFrontCover = currentPage === 0 && frontCover;
    const isBackCover = currentPage === totalPages - 1 && backCover;
    const isRegularPage = !isFrontCover && !isBackCover;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-story md:text-xl font-semibold text-gray-900 mb-4">
          Edit Story Content
        </h3>
        <div className="rounded-[20px] bg-[#F8F9FA] border border-[#E5E5E5] w-[570px] p-4 space-y-4">
          
          {isFrontCover && (
            <>
              <div>
                <label className="text-[14px] font-bold text-[#333333] block mb-2">Title:</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full p-2 border border-[#E5E5E5] rounded-[8px] text-[14px] focus:outline-none focus:border-[#8C5AF2]"
                  placeholder="Enter story title"
                />
              </div>
              <div>
                <label className="text-[14px] font-bold text-[#333333] block mb-2">Author:</label>
                <input
                  type="text"
                  value={editData.author}
                  onChange={(e) => handleInputChange("author", e.target.value)}
                  className="w-full p-2 border border-[#E5E5E5] rounded-[8px] text-[14px] focus:outline-none focus:border-[#8C5AF2]"
                  placeholder="Enter author name"
                />
              </div>
              
              <div className="bg-[#F0F8FF] border border-[#B0D4F1] rounded-[8px] p-3">
                <p className="text-[12px] text-[#1E40AF] font-medium">
                  💡 Note: Updating title or author will automatically generate a new front cover image
                </p>
              </div>
            </>
          )}

          {(isRegularPage || isBackCover) && (
            <div>
              <label className="text-[14px] font-bold text-[#333333] block mb-2">
                {isBackCover ? "Back Cover Content:" : "Story Text:"}
              </label>
              <textarea
                value={editData.text}
                onChange={(e) => handleInputChange("text", e.target.value)}
                rows={6}
                className="w-full p-2 border border-[#E5E5E5] rounded-[8px] text-[14px] focus:outline-none focus:border-[#8C5AF2] resize-none"
                placeholder={isBackCover ? "Enter back cover content" : "Enter story content"}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleEditStory}
              disabled={editLoading || imageGenerating}
              className="px-4 py-2 bg-[#8C5AF2] text-white text-[14px] font-semibold rounded-[8px] hover:bg-[#7C4AE8] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editLoading ? "Saving..." : imageGenerating ? "Generating Image..." : "Save Changes"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={editLoading || imageGenerating}
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
      maxWidth="max-w-[620px]"
      className="mt-[81px]"
    >
      <div className="flex flex-wrap justify-center items-center flex-col-reverse gap-8 px-8 py-6">
        <div>
          {modalLoading ? (
            <div className="space-y-6">
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
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <> 
              {isEditing ? renderEditForm() : renderPageText()}
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
            <div className="rounded-[20px] overflow-hidden relative">
              {getCurrentPageImage() ? (
                <>
                  <img
                    src={getCurrentPageImage()}
                    alt={getPageTitle()}
                    className={`w-[560px] h-[560px] object-cover transition-opacity ${imageGenerating ? 'opacity-50' : 'opacity-100'}`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.parentElement!.innerHTML =
                        '<div class="w-[560px] h-[560px] flex items-center justify-center text-gray-500 bg-gray-100 rounded-[20px]">Failed to load image</div>';
                    }}
                  />
                  
                  {/* Image Generation Overlay */}
                  {imageGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-[20px]">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-sm font-medium">Generating new image...</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-[560px] h-[560px] flex items-center justify-center text-gray-500 bg-gray-100 rounded-[20px]">
                  No image available
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
            <span className="text-[#8C5AF2] font-semibold">{currentPage + 1}</span>
            <span className="mx-1">/</span>
            <span>{totalPages}</span>
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
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
