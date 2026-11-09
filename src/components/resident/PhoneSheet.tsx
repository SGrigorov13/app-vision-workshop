import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Android-style bottom sheet that stays inside the phone frame. */
export function PhoneSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={cn("absolute inset-0 z-40", open ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-overlay backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "no-scrollbar absolute inset-x-0 bottom-0 max-h-[90%] overflow-y-auto rounded-t-[28px] bg-card px-5 pb-8 pt-3 text-card-foreground shadow-sheet transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          open ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        {title && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Затвори"
              className="grid size-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        {open && children}
      </div>
    </div>
  );
}
