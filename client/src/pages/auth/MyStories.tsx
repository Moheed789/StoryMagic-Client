"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import DeleteStoryModal from "../../components/DeleteStoryModal"
import StoryPreviewModal from "../../components/StoryPreviewModal"
import { Check, Trash } from "lucide-react"

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
  downloadOptions?: string[]
  downloadHistory?: Array<{
    downloadOption: string
    status: string
    downloadable: string
  }>
  downloadable?: string
  downloadOption?: string
  downloadStatus?: string
  pdfPurchased?: boolean
  bookPurchased?: boolean
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStory, setModalStory] = useState<StoryDetails | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<{ id: string; title: string } | null>(null)

  const [purchaseLoading, setPurchaseLoading] = useState<{ [storyId: string]: { pdf?: boolean; book?: boolean } }>({})

  const [selectedDownloadOption, setSelectedDownloadOption] = useState<{ [storyId: string]: 'pdf_only' | 'pdf_and_book' }>({})

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

  const handlePurchase = async (storyId: string, downloadOption: 'pdf_only' | 'pdf_and_book') => {
    try {
      setPurchaseLoading(prev => ({
        ...prev,
        [storyId]: {
          ...prev[storyId],
          [downloadOption === 'pdf_only' ? 'pdf' : 'book']: true
        }
      }))

      const session: any = await fetchAuthSession()
      const token = session?.tokens?.idToken?.toString()

      if (!token) {
        alert("Please login first")
        return
      }

      const response = await fetch(
        "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/stripe/story-download-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            storyId: storyId,
            downloadOption: downloadOption
          })
        }
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Purchase failed")

      const checkoutUrl = data.url || data.sessionUrl || data.checkout_url || data.checkoutUrl || data.session?.url

      if (checkoutUrl) {
        localStorage.setItem('pendingPurchase', JSON.stringify({
          storyId,
          downloadOption,
          timestamp: Date.now()
        }))

        window.location.href = checkoutUrl
      } else {
        alert("Checkout URL not found")
      }
    } catch (error: any) {
      alert(`Purchase failed: ${error.message}`)
    } finally {
      setPurchaseLoading(prev => ({
        ...prev,
        [storyId]: {
          ...prev[storyId],
          [downloadOption === 'pdf_only' ? 'pdf' : 'book']: false
        }
      }))
    }
  }

  const handleDownload = async (storyId: string, downloadOption: 'pdf_only' | 'pdf_and_book') => {
    try {
      const session: any = await fetchAuthSession()
      const token = session?.tokens?.idToken?.toString()

      if (!token) {
        alert("Please login first")
        return
      }

      // Show loading state
      const story = stories.find(s => s.storyId === storyId)
      if (!story) {
        alert("Story not found")
        return
      }

      console.log('Starting download for:', storyId, 'option:', downloadOption)

      const response = await fetch(
        `https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/stories/${storyId}/export-pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Download API error response:', errorText)
        throw new Error(`Download failed: ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      console.log('Response content-type:', contentType)

      if (contentType?.includes('application/json')) {
        const jsonData = await response.json()
        console.log('JSON response:', jsonData)
        
        if (jsonData.downloadUrl || jsonData.url || jsonData.pdfUrl) {
          const downloadUrl = jsonData.downloadUrl || jsonData.url || jsonData.pdfUrl
          
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = `${story.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Story'}_${downloadOption}.pdf`
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          console.log(`Successfully initiated download from URL: ${downloadUrl}`)
          return
        }
                throw new Error(jsonData.message || "No download URL provided")
      }

      if (contentType?.includes('application/pdf')) {
        const blob = await response.blob()
        
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const filename = `${story.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Story'}_${downloadOption}.pdf`
        link.download = filename
        
        document.body.appendChild(link)
        link.click()
        
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        console.log(`Successfully downloaded PDF blob for: ${storyId}`)
        return
      }

      const responseText = await response.text()
      console.log('Unknown response format:', responseText)
      throw new Error("Unsupported response format")

    } catch (error: any) {
      console.error('Download error:', error)
      alert(`Download failed: ${error.message}`)
    }
  }

  const isPurchased = (story: Story, option: 'pdf_only' | 'pdf_and_book') => {
    console.log('Checking story:', story.storyId, 'for option:', option)
    console.log('Story download fields:', {
      downloadOptions: story.downloadOptions,
      downloadHistory: story.downloadHistory
    })

    if (story.downloadHistory && Array.isArray(story.downloadHistory)) {
      const purchasedOption = story.downloadHistory.find(
        item => item.downloadOption === option &&
          item.status === "paid" &&
          item.downloadable === "Yes"
      )

      if (purchasedOption) {
        console.log('PURCHASED via downloadHistory!')
        return true
      }
    }

    const isDownloadable = story.downloadable === "Yes"
    const isPaid = story.downloadStatus === "paid"
    const optionMatches = story.downloadOption === option

    if (isDownloadable && isPaid && optionMatches) {
      console.log('PURCHASED via legacy API!')
      return true
    }

    console.log('NOT PURCHASED')
    return false
  }

  const isOptionAvailable = (story: Story, option: 'pdf_only' | 'pdf_and_book') => {
    return true
  }

  const isPurchaseLoading = (storyId: string, option: 'pdf_only' | 'pdf_and_book') => {
    return purchaseLoading[storyId]?.[option === 'pdf_only' ? 'pdf' : 'book'] || false
  }

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

  const handleDownloadOptionSelect = (storyId: string, option: 'pdf_only' | 'pdf_and_book') => {
    setSelectedDownloadOption(prev => ({
      ...prev,
      [storyId]: option
    }))
  }

  const getSelectedOption = (story: Story) => {
    const pdfPurchased = isPurchased(story, 'pdf_only')
    const bookPurchased = isPurchased(story, 'pdf_and_book')

    if (selectedDownloadOption[story.storyId]) {
      return selectedDownloadOption[story.storyId]
    }

    if (bookPurchased) return 'pdf_and_book'
    if (pdfPurchased) return 'pdf_only'

    return 'pdf_only'
  }

  const heading = useMemo(
    () => (
      <div className="text-center mb-8 md:mb-10 mt-[105px]">
        <h1 className=" items-baseline gap-2 text-3xl md:text-[40px] font-black tracking-tight">
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
      <div className="max-w-[1579px] mx-auto px-4 py-10">
        {heading}
        <div className="flex flex-wrap gap-[44px] justify-center md:justify-start">
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
      <div className="max-w-[1579px] mx-auto px-4 py-10">
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

  return (
    <div className="w-full max-w-[1619px] mx-auto px-4 py-10">
      {heading}

      {stories.length === 0 ? (
        <p className="text-center text-slate-500">No stories found.</p>
      ) : (
        <div className="flex flex-wrap gap-[44px] justify-center xl:justify-start">
          {stories.map((story) => {
            const pdfPurchased = isPurchased(story, 'pdf_only')
            const bookPurchased = isPurchased(story, 'pdf_and_book')

            const pdfLoading = isPurchaseLoading(story.storyId, 'pdf_only')
            const bookLoading = isPurchaseLoading(story.storyId, 'pdf_and_book')
            const selectedOption = getSelectedOption(story)

            return (
              <div key={story.storyId} className="rounded-[20px] border  border-[#CCD8D3] bg-[#F4F3F7] w-[497px] shadow-sm overflow-hidden">
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

                <div className="p-6">
                  <h3 className="text-[24px] font-bold font-display text-[#333333] mb-4 leading-tight">
                    {story.title}
                  </h3>

                    <p className="text-[14px] text-[#8C5AF2] italic mb-4 font-medium">
                      Select Download Option
                    </p>

                  <div className="space-y-3 mb-6">
                    <div
                      onClick={() => pdfPurchased && handleDownloadOptionSelect(story.storyId, 'pdf_only')}
                      className={`flex items-center justify-between p-4 border rounded-[12px] transition-colors cursor-pointer ${
                        pdfPurchased && selectedOption === 'pdf_only'
                          ? 'border-[#8C5AF2] bg-[#F8F6FF]'
                          : pdfPurchased
                          ? 'border-[#E5E5E5] bg-white hover:border-[#8C5AF2]/50'
                          : 'border-[#E5E5E5] bg-white cursor-default'
                      }`}>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <span className="text-[14px] text-[#333333] font-medium">
                            Downloadable PDF Only -
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
                              e.stopPropagation()
                              handlePurchase(story.storyId, 'pdf_only')
                            }}
                            disabled={pdfLoading}
                            className="text-[#8C5AF2] underline text-[14px] font-medium transition hover:text-[#7C4AE8] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {pdfLoading ? "Processing..." : "Buy Now"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div
                      onClick={() => bookPurchased && handleDownloadOptionSelect(story.storyId, 'pdf_and_book')}
                      className={`flex items-center justify-between p-4 border rounded-[12px] transition-colors cursor-pointer ${
                        bookPurchased && selectedOption === 'pdf_and_book'
                          ? 'border-[#8C5AF2] bg-[#F8F6FF]'
                          : bookPurchased
                          ? 'border-[#E5E5E5] bg-white hover:border-[#8C5AF2]/50'
                          : 'border-[#E5E5E5] bg-white cursor-default'
                      }`}>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 w-full max-w-[249px]">
                          <span className="text-[14px] text-[#333333] font-medium">
                            Downloadable PDF + Professionally Printed Book -
                          </span>
                          <span className="text-[14px] font-bold text-[#8C5AF2] ml-1">
                            Higher Price (TBD)
                          </span>
                        </div>
                      </div>

                      <div className="">
                        {bookPurchased ? (
                          <span className="text-[#28A745] flex items-center gap-[6px] text-[14px] font-semibold">
                            Purchased <Check size={14} />
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePurchase(story.storyId, 'pdf_and_book')
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
                      {selectedOption === 'pdf_and_book' ? "Download PDF + Book" : "Download PDF Only"}
                    </p>
                  )}

                  <div className="space-y-3">
                    <button
                      onClick={() => handleDownload(story.storyId, selectedOption)}
                      disabled={!pdfPurchased && !bookPurchased}
                      className="w-full h-[48px] rounded-[12px] bg-[#8C5AF2] text-white text-[16px] font-semibold hover:bg-[#7C4AE8] transition disabled:bg-[#CCCCCC] disabled:cursor-not-allowed"
                    >
                      {!pdfPurchased && !bookPurchased ? "Purchase Required" : "Download"}
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
            )
          })}
        </div>
      )}

      <StoryPreviewModal
        isOpen={isModalOpen}
        onClose={closeModal}
        modalStory={modalStory}
        modalLoading={modalLoading}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

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