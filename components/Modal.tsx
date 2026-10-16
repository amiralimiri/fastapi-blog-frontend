"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({
  title,
  children,
  onClose,
  danger = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  danger?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", fn);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card">
        <div className={`modal-header ${danger ? "danger" : ""}`}>
          <h3 id="modal-title">{title}</h3>
          <button
            className="icon-button inline-flex items-center justify-center p-1 hover:opacity-80 transition"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function AlertModal({
  kind,
  message,
  onClose,
}: {
  kind: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  return (
    <Modal
      title={kind === "success" ? "Success" : "Error"}
      onClose={onClose}
      danger={kind === "error"}
    >
      <div className="modal-body">
        <p className="modal-message">{message}</p>
      </div>
      <div className="modal-footer">
        <button className="btn secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}

