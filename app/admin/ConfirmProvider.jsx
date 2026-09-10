"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

const ConfirmContext = createContext(null);
export const useConfirm = () => useContext(ConfirmContext);

// Styled promise-based confirm modal — replaces window.confirm.
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

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
          className="fixed inset-0 z-[210] flex items-center justify-center bg-[rgba(17,16,20,0.55)] p-4"
          onClick={() => handle(false)}
        >
          <div
            className="w-full max-w-md rounded-[14px] bg-white p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-full text-2xl ${
                dialog.danger ? "bg-[#fbe9e8] text-[#b3261e]" : "bg-[#f3ead9] text-[#8a6a34]"
              }`}
            >
              ⚠
            </div>
            <h5 className="mb-2 mt-3 text-lg font-bold">{dialog.title}</h5>
            {dialog.message && <p className="mb-0 text-sm text-neutral-500">{dialog.message}</p>}
            <div className="flex justify-center gap-2 pb-2 pt-4">
              <button onClick={() => handle(false)} className="border border-neutral-400 px-5 py-2 text-sm">
                {dialog.cancelLabel}
              </button>
              <button
                onClick={() => handle(true)}
                autoFocus
                className={`px-5 py-2 text-sm font-semibold text-white ${
                  dialog.danger ? "bg-[#b3261e]" : "bg-neutral-950"
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
