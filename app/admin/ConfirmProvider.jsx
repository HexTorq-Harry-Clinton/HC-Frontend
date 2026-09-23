"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import useLockBody from "./useLockBody";

const ConfirmContext = createContext(null);
export const useConfirm = () => useContext(ConfirmContext);

// Styled promise-based confirm modal — replaces window.confirm.
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);
  // Open confirm owns the scroll — page behind is frozen.
  useLockBody(!!dialog);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        title: opts.title || "Are you sure?",
        message: opts.message || "",
        confirmLabel: opts.confirmLabel || "Confirm",
        cancelLabel: opts.cancelLabel || "Cancel",
        danger: !!opts.danger,
      });
    });
  }, []);

  const handle = (value) => {
    setDialog(null);
    resolverRef.current?.(value);
    resolverRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-[rgba(17,16,20,0.55)] p-4 backdrop-blur-sm"
          onClick={() => handle(false)}
        >
          <div
            className="w-full max-w-md  border border-black/5 bg-white p-7 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`mx-auto flex h-[52px] w-[52px] items-center justify-center  text-2xl ${
                dialog.danger ? "bg-red-50 text-red-600" : "bg-gold/15 text-gold-deep"
              }`}
            >
              <i className={dialog.danger ? "bi bi-exclamation-triangle-fill" : "bi bi-question-circle-fill"} />
            </div>
            <h5 className="mb-2 mt-4 text-lg font-bold text-neutral-900">{dialog.title}</h5>
            {dialog.message && <p className="mb-0 text-sm leading-relaxed text-neutral-500">{dialog.message}</p>}
            <div className="flex justify-center gap-3 pt-5">
              <button
                type="button"
                onClick={() => handle(false)}
                className="inline-flex items-center justify-center  border border-neutral-300 bg-white px-5 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              >
                {dialog.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => handle(true)}
                autoFocus
                className={`inline-flex items-center justify-center  px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  dialog.danger
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500/40"
                    : "bg-neutral-950 hover:bg-gold hover:text-neutral-950 focus:ring-gold/50"
                }`}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
