import React, { useState } from 'react'
import Modal from './Modal'

interface DownloadStoryModalProps {
  isOpen: boolean
  onClose: () => void
  storyId: string
  storyTitle: string
}

const DownloadStoryModal: React.FC<DownloadStoryModalProps> = ({
  isOpen,
  onClose,
  storyId,
  storyTitle
}) => {
  const [selectedOption, setSelectedOption] = useState<'pdf' | 'book'>('pdf')
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    
    try {
      // Your download logic here
      console.log(`Downloading ${selectedOption} for story: ${storyId}`)
      
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Close modal after successful download
      onClose()
    } catch (error) {
      console.error('Error downloading story:', error)
      alert('Failed to download story. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-[603px]"
      showCloseButton={false}
    >
      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-[32px] font-display font-black text-[#8C5AF2] mb-2">
            Download Story
          </h2>
          <p className="text-[#6F677E] text-[16px] font-story">
            Select a download option below to get your story.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-8">
          {/* PDF Option */}
          <label className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="downloadOption"
              value="pdf"
              checked={selectedOption === 'pdf'}
              onChange={() => setSelectedOption('pdf')}
              className="w-5 h-5 accent-[#8C5AF2]"
              style={{
                accentColor: '#8C5AF2'
              }}
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-[14px] font-story text-gray-900">
                  Downloadable PDF Only -
                </span>
                <span className="text-[14px] font-bold text-[#8C5AF2]">
                  $2.99
                </span>
              </div>
            </div>
          </label>

          {/* Book Option */}
          <label className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="downloadOption"
              value="book"
              checked={selectedOption === 'book'}
              onChange={() => setSelectedOption('book')}
              className="w-5 h-5 accent-[#8C5AF2]"
              style={{
                accentColor: '#8C5AF2'
              }}
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-[14px] font-story text-gray-900">
                  Downloadable PDF + Professionally Printed Book -
                </span>
                <span className="text-[14px] font-bold text-[#8C5AF2]">
                  Higher Price (TBD)
                </span>
              </div>
            </div>
          </label>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={onClose}
            disabled={isDownloading}
            className="flex-1 py-3 px-4 bg-white border border-[#8C5AF2] text-[#8C5AF2] font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 py-3 px-4 bg-[#8C5AF2] hover:bg-[#7C4AE8] text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default DownloadStoryModal