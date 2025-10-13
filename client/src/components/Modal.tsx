import { X } from "lucide-react"
import React from "react"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    maxWidth?: string
    showCloseButton?: boolean
    className?: string
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = "max-w-6xl",
    showCloseButton = true,
    className = ""
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#2222221F] backdrop-blur-[20px]">
            <div className={`relative w-full ${maxWidth} max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.25)] ring-1 ring-black/5 ${className}`}>
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                        {title && (
                            <h2 className="text-[28px] font-display md:text-[32px] font-black tracking-tight text-gray-900">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                aria-label="Close"
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none ml-auto"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default Modal