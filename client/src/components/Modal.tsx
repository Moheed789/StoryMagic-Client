import { X } from "lucide-react";
import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
  className?: string;
  disableClose?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-6xl",
  showCloseButton = true,
  className = "",
  disableClose = false,
}) => {
  useEffect(() => {
    if (isOpen) { 
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  const handleBackdropClick = () => {
    if (!disableClose) onClose();
  };

  return (
    <div
      className="
        fixed inset-0 z-30 flex items-center justify-center 
        bg-[#2222221F] backdrop-blur-[20px]
        p-4 sm:p-6
        overflow-hidden
      "
      style={{ paddingTop: "80px" }}
      onClick={handleBackdropClick}
    >
      <div
        className={`relative w-full ${maxWidth} max-h-[85vh] overflow-y-auto rounded-2xl 
          bg-white shadow-[0_30px_80px_rgba(0,0,0,0.25)] ring-1 ring-black/5 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 sticky top-0 bg-white z-10">
            {title && (
              <h2 className="text-[28px] font-display md:text-[32px] font-black tracking-tight text-gray-900">
                {title}
              </h2>
            )}

            {showCloseButton && (
              <button
                onClick={disableClose ? undefined : onClose}
                disabled={disableClose}
                aria-label="Close"
                className={`
                  absolute top-6 right-6 
                  text-gray-400 
                  ${
                    disableClose
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:text-gray-600"
                  }
                  text-2xl font-bold leading-none
                `}
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        <div className="overflow-y-auto max-h-[calc(85vh-100px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
