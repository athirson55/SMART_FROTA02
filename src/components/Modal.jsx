import { useEffect, useRef } from "react";

/**
 * Modal reutilizável com overlay, foco preso e fechamento por ESC.
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - title: string
 *  - size: "sm" | "md" | "lg" (default "md")
 *  - children: ReactNode
 *  - footer: ReactNode (opcional)
 */
export function Modal({ open, onClose, title, size = "md", children, footer }) {
  const dialogRef = useRef(null);

  // Fecha com ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Trava o scroll do body quando o modal está aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const widths = { sm: 420, md: 560, lg: 720 };

  return (
    <div
      className="sf-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sf-modal-title"
    >
      <div
        ref={dialogRef}
        className="sf-modal"
        style={{ maxWidth: widths[size] || 560 }}
      >
        {/* Header */}
        <div className="sf-modal-header">
          <h2 id="sf-modal-title" className="sf-modal-title">{title}</h2>
          <button
            type="button"
            className="sf-modal-close"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="sf-modal-body">{children}</div>

        {/* Footer */}
        {footer && <div className="sf-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
