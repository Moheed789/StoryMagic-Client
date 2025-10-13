"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { Link } from "wouter"
import DeleteStoryModal from "../../components/DeleteStoryModal"
import { Trash } from "lucide-react"

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
  description?: string
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
        console.log(":rocket: ~ loadStories ~ data:", data)

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
      console.log(":rocket: ~ openPreviewModal ~ data:", data)
      setModalStory(data)
    } catch (err) {
      console.error("Error loading story:", err)
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setModalStory(null)
    setCurrentPage(0)
  }

  // Delete story functions
  const openDeleteModal = (storyId: string, title: string) => {
    setStoryToDelete({ id: storyId, title })
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setStoryToDelete(null)
  }

  const handleStoryDeleted = (deletedStoryId: string) => {
    // Remove the deleted story from the stories array
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
  const currentPageData = pages[currentPage]
  const pageTitle = currentPage === 0 ? "Front Cover" : `Page ${currentPage + 1}`

  // Get the content to display - check multiple possible field names
  const getPageContent = (pageData: StoryPage) => {
    return pageData?.text || pageData?.content || pageData?.imagePrompt || "No content available"
  }

  const getPageImage = (pageData: StoryPage) => {
    return pageData?.imageUrl || modalStory?.coverImageUrl
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {heading}

      {/* Print styles scoped here */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            .print-grid {
              display: grid !important;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            @page { margin: 12mm; }
            .print-card {
              break-inside: avoid;
              page-break-inside: avoid;
              border: 1px solid #e5e7eb;
              box-shadow: none !important;
            }
          }
        `}
      </style>

      {stories.length > 0 && (
        <div className="no-print flex justify-end mb-4">
          <button
            onClick={() => window.print()}
            className="h-10 px-4 rounded-md bg-[#8C5AF2] text-white text-sm font-medium hover:bg-violet-700 transition"
          >
            Print All
          </button>
        </div>
      )}

      {stories.length === 0 ? (
        <p className="text-center text-slate-500">No stories found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print-grid">
          {stories.map((story) => {
            const img = story.coverImageUrl || "/placeholder-cover.jpg"
            const formatDate = (timestamp: number) => {
              return new Date(timestamp).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            }

            return (
              <div
                key={story.storyId}
                className=" rounded-[20px] border border-[#CCD8D3] overflow-hidden relative"
              >
                

                <div className="relative aspect-[16/9] w-full">
                  <img
                    src={story.coverImageUrl || "/placeholder-cover.jpg"}
                    alt={story.title}
                    className="h-full w-full object-cover"
                  />

                  <button
                  onClick={() => openDeleteModal(story.storyId, story.title || "Untitled Story")}
                  className="absolute bottom-3 right-3 w-6 h-6 bg-[#FFFFFF] text-[#FF383C] rounded-full flex items-center justify-center text-sm font-bold transition-colors z-10 no-print"
                  title="Delete Story"
                >
                  <Trash size={14} />
                </button>
                </div>

                <div className="bg-[#F4F3F7]  p-4">
                  <h3 className="font-semibold text-slate-800 mb-2">{story.title || "Untitled Story"}</h3>

                  <div className="mb-3 text-xs text-slate-500 space-y-1">
                    <p>
                      Status: <span className="capitalize">{story.status?.toLowerCase()}</span>
                    </p>
                    {story.createdAt && <p>Created: {formatDate(story.createdAt)}</p>}
                  </div>

                  {!isAuthed && (
                    <p className="mt-1 text-xs text-slate-500 mb-3">
                      You need to be signed in to Create a Story.
                      <br />
                      Please log in to continue.
                    </p>
                  )}

                  {/* Buttons (hidden on print with no-print) */}
                  <div className="mt-4 space-y-2">
                    <Link href={`/stories/${story.storyId}/download`} className="block no-print">
                      <button className="w-full h-10 rounded-md bg-[#8C5AF2] text-white text-[16px] font-semibold hover:bg-[#8C5AF2] transition">
                        Download
                      </button>
                    </Link>

                    <button
                      onClick={() => openPreviewModal(story.storyId)}
                      className="w-full h-10 rounded-md  text-[#8C5AF2] text-[16px] font-semibold hover:bg-violet-200 transition no-print"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Preview Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <h2 className="text-[28px] md:text-[32px] font-black tracking-tight text-gray-900">
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

            {/* Modal Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Left: Image Description */}
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Image Description</h3>

                {modalLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                  </div>
                ) : (
                  <>
                    {/* Show story description on front cover, page content on other pages */}
                    <div className="rounded-xl bg-gray-100/80 text-gray-700 leading-relaxed p-5 md:p-6 shadow-inner">
                      {currentPage === 0 ? (
                        // Front Cover - show story description or first page content
                        <p className="whitespace-pre-line text-[14px] md:text-[15px]">
                          {modalStory?.description || 
                           (currentPageData ? getPageContent(currentPageData) : "No description available")}
                        </p>
                      ) : (
                        // Other pages - show page content
                        <p className="whitespace-pre-line text-[14px] md:text-[15px]">
                          {currentPageData ? getPageContent(currentPageData) : "No content available"}
                        </p>
                      )}
                    </div>

                    {/* Primary action "Edit Story" in purple */}
                    <div className="mt-6">
                      <button className="inline-flex h-10 items-center px-4 rounded-md bg-[#8C5AF2] text-white text-sm font-semibold hover:bg-[#8C5AF2] transition">
                        Edit Story
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Right: Image Preview */}
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Image Preview</h3>
                {modalLoading ? (
                  <div className="aspect-[4/3] bg-gray-200 rounded-xl animate-pulse" />
                ) : (
                  <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                    {getPageImage(currentPageData) ? (
                      <img
                        src={getPageImage(currentPageData)}
                        alt={`Page ${currentPage + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No image available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer - Navigation */}
            {!modalLoading && modalStory && pages.length > 0 && (
              <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  {"< Back"}
                </button>

                <div className="text-sm text-gray-600">
                  <span className="text-[#8C5AF2] font-semibold">{currentPage + 1}</span>
                  <span className="mx-1">/</span>
                  <span>{pages.length}</span>
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                  disabled={currentPage === pages.length - 1}
                  className="text-sm font-semibold text-[#8C5AF2] hover:text-violet-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  {"Next >"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
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