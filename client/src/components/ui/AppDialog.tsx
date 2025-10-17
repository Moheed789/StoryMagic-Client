"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: AppDialogProps) {
  const sizeClass =
    size === "sm"
      ? "max-w-sm"
      : size === "lg"
      ? "max-w-2xl"
      : "max-w-lg";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("p-8", sizeClass, className)}>
        {(title || description) && (
          <DialogHeader>
            {title && (
              <DialogTitle className="text-[26px] text-primary font-display text-center">
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className="text-[16px] text-center text-muted-foreground font-story">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        {children && <div className="mt-4">{children}</div>}
        {footer && (
          <DialogFooter className="mt-6 sm:justify-center">{footer}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
