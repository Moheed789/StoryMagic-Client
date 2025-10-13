"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { Link } from "wouter"
import DeleteStoryModal from "../../components/DeleteStoryModal"
import { ChevronLeft, ChevronRight, Trash } from "lucide-react"

type Story = {
  storyId: string
  title: string
  description?: string | null
  status?: string
  totalPages?: number
  coverImageUrl?: string | null
  createdAt?: number
  updatedAt?: number
  userId?: string
}

type StoryPage = {
  pageNumber?: number
  text?: string
  content?: string
  imageUrl?: string
  imagePrompt?: string
  createdAt?: number
  pageId?: string
  pk?: string
  sk?: string
  storyId?: string
  type?: string
}

type StoryDetails = {
  storyId: string
  title: string
  imagePrompt?: string
  status: string
  totalPages: number
  coverImageUrl?: string
  createdAt: number
  updatedAt: number
  userId: string
  pages?: StoryPage[]
}

const MyStories: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthed, setIsAuthed] = useState(false)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStory, setModalStory] = useState<StoryDetails | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => {
    const loadStories = async () => {
      try {
        const session: any = await fetchAuthSession()
        const token = session?.tokens?.idToken?.toString()
        setIsAuthed(Boolean(token))

        const res = await fetch("https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/stories", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) throw new Error("Failed to fetch stories")
        const data = await res.json()

        if (data?.stories && Array.isArray(data.stories)) {
          setStories(data.stories)
        } else if (Array.isArray(data)) {
          setStories(data)
        } else {
          setStories([])
        }
      } catch (err: any) {
        setError(err?.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    loadStories()
  }, [])

  const openPreviewModal = async (storyId: string) => {
    setModalLoading(true)
    setIsModalOpen(true)
    setCurrentPage(0)

    try {
      const session: any = await fetchAuthSession()
      const token = session?.tokens?.idToken?.toString()

      const res = await fetch(`https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/stories/${storyId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) throw new Error("Failed to fetch story")
      const data = await res.json()
      setModalStory(data)
    } catch (err) {
      console.error(err)
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setModalStory(null)
    setCurrentPage(0)
  }

  const openDeleteModal = (storyId: string, title: string) => {
    setStoryToDelete({ id: storyId, title })
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setStoryToDelete(null)
  }

  const handleStoryDeleted = (deletedStoryId: string) => {
    setStories(prevStories => prevStories.filter(story => story.storyId !== deletedStoryId))
  }

  const heading = useMemo(
    () => (
      <div className="text-center mb-8 md:mb-10 mt-[105px]">
        <h1 className="inline-flex items-baseline gap-2 text-3xl md:text-[40px] font-black tracking-tight">
          <span className="text-[#24212C] font-display text-[64px] font-[400]">Your Magical</span>
          <span className="text-[#8C5AF2] font-display text-[64px] font-[400]">Stories</span>
        </h1>
        <p className="text-[#6F677E] font-[500] text-[24px] font-story mt-[16px]">
          Browse, download, or relive the stories you've created with AI.
        </p>
      </div>
    ),
    [],
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        {heading}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
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
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        {heading}
        <p className="text-red-500 text-center">{error}</p>
      </div>
    )
  }

  const pages = modalStory?.pages || []

  const sortedPages = pages.sort((a, b) => {
    if (a.type === 'COVER_FRONT') return -1
    if (b.type === 'COVER_FRONT') return 1
    if (a.type === 'COVER_BACK') return 1
    if (b.type === 'COVER_BACK') return -1
    return (a.pageNumber || 0) - (b.pageNumber || 0)
  })

  const frontCover = sortedPages.find(p => p.type === 'COVER_FRONT')
  const backCover = sortedPages.find(p => p.type === 'COVER_BACK')
  const storyPages = sortedPages.filter(p => p.type === 'PAGE')
  const totalPages = (frontCover ? 1 : 0) + storyPages.length + (backCover ? 1 : 0)

  const getPageTitle = () => {
    if (currentPage === 0 && frontCover) return "Front Cover"
    if (currentPage === totalPages - 1 && backCover) return "Back Cover"
    return `Page ${currentPage - (frontCover ? 0 : -1)}`
  }

  const pageTitle = getPageTitle()

  // Get page text content (separate from image description)
  const getCurrentPageText = () => {
    // Front cover and back cover mein text content nahi dikhana
    if (currentPage === 0 && frontCover) return null
    if (currentPage === totalPages - 1 && backCover) return null

    // Regular story pages mein text content dikhana
    const pageIndex = currentPage - (frontCover ? 1 : 0)
    const pageData = storyPages[pageIndex]

    if (pageData) {
      return pageData.text || pageData.content || null
    }

    return null
  }

  const getCurrentPageContent = () => {
    if (currentPage === 0 && frontCover) {
      const description = modalStory?.imagePrompt || frontCover.imagePrompt || "No description available"
      return `${description}`
    }

    if (currentPage === totalPages - 1 && backCover) {
      return backCover.imagePrompt || backCover.content || "The End\n\nThank you for reading this magical story!"
    }

    // Regular pages ke liye image description
    const pageIndex = currentPage - (frontCover ? 1 : 0)
    const pageData = storyPages[pageIndex]
    if (pageData) {
      return pageData.imagePrompt || "No description available"
    }

    return "No content available"
  }

  const getCurrentPageImage = () => {
    if (currentPage === 0 && frontCover) {
      return frontCover.imageUrl || modalStory?.coverImageUrl
    }

    if (currentPage === totalPages - 1 && backCover) {
      return backCover.imageUrl || modalStory?.coverImageUrl
    }

    const pageIndex = currentPage - (frontCover ? 1 : 0)
    const pageData = storyPages[pageIndex]
    return pageData?.imageUrl || modalStory?.coverImageUrl
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {heading}

      {stories.length === 0 ? (
        <p className="text-center text-slate-500">No stories found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <div key={story.storyId} className="rounded-[20px] border border-[#CCD8D3] overflow-hidden relative">
              <div className="relative aspect-[16/9] w-full">
                <img
                  src={story.coverImageUrl || "/placeholder-cover.jpg"}
                  alt={story.title}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => openDeleteModal(story.storyId, story.title || "Untitled Story")}
                  className="absolute bottom-3 right-3 w-6 h-6 bg-[#FFFFFF] text-[#FF383C] rounded-[6px] flex items-center justify-center text-sm font-bold transition-colors z-10"
                  title="Delete Story"
                >
                  <Trash size={16} />
                </button>
              </div>

              <div className="bg-[#F4F3F7] p-4">
                <h3 className="text-[24px] leading-[100%] font-display text-slate-800 mb-2">{story.title || "Untitled Story"}</h3>

                <div className="mb-3 text-xs text-slate-500 space-y-1">
                  <p>Status: <span className="capitalize font-story">{story.status?.toLowerCase()}</span></p>
                </div>

                {!isAuthed && (
                  <p className="mt-1 text-xs text-slate-500 mb-3">
                    You need to be signed in to Create a Story.
                    <br />
                    Please log in to continue.
                  </p>
                )}

                <div className="mt-4 space-y-2">
                  <Link href={`/stories/${story.storyId}/download`} className="block">
                    <button className="w-full h-10 rounded-md bg-[#8C5AF2] text-white text-[16px] font-semibold hover:bg-[#8C5AF2] transition">
                      Download
                    </button>
                  </Link>

                  <button
                    onClick={() => openPreviewModal(story.storyId)}
                    className="w-full h-10 rounded-md text-[#8C5AF2] text-[16px] font-semibold hover:bg-violet-200 transition"
                  >
                    Preview
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="relative w-full max-w-[1284px] max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
            <div className="flex items-center justify-between px-8 py-6 border-gray-100">
              <h2 className="text-[28px] font-display md:text-[32px] font-black tracking-tight text-gray-900">
                {modalLoading ? "Loading..." : pageTitle}
              </h2>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
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
                        <div className="rounded-[20px] bg-[#EFEFEF] text-[#616161] leading-relaxed w-[570px] p-4 ">
                          <p className="whitespace-pre-line w-[515px] text-[14px] font-medium">
                            {getCurrentPageText()}
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-story  md:text-xl font-semibold text-gray-900 mb-4">
                        {currentPage === 0 ? "Front Cover Description" :
                          currentPage === totalPages - 1 ? "Back Cover Description" :
                            "Image Description"}
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
                <h3 className="text-lg md:text-xl font-story font-semibold text-gray-900 mb-4">Image Preview</h3>
                {modalLoading ? (
                  <div className="w-[560px] h-[560px] bg-gray-200 rounded-[20px] animate-pulse" />
                ) : (
                  <div className="rounded-[20px] overflow-hidden">
                    {getCurrentPageImage() ? (
                      <img
                        src={getCurrentPageImage()}
                        alt={pageTitle}
                        className="w-[560px] h-[560px] object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          target.parentElement!.innerHTML = '<div class="w-[560px] h-[560px] flex items-center justify-center text-gray-500 bg-gray-100 rounded-[20px]">Failed to load image</div>'
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
          </div>
        </div>
      )}

      <DeleteStoryModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        storyId={storyToDelete?.id || ''}
        storyTitle={storyToDelete?.title || ''}
        onDelete={handleStoryDeleted}
      />
    </div>
  )
}

export default MyStories