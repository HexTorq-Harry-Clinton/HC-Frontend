"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

// Toast stack: dark cards, auto-dismiss 4.2g — same behavior as the previous UI.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, text) => {
      const id = ++idRef.current;
      setToasts((list) => [...list, { id, type, text }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove]
  );

  const api = {
    success: (text) => push("success", text),
    error: (text) => push("error", text),
    info: (text) => push("info", text),
  };

  const ICON = {
    success: "bi bi-check-circle-fill",
    error: "bi bi-x-circle-fill",
    info: "bi bi-info-circle-fill",
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed right-5 top-[76px] z-[200] flex w-[340px] max-w-[calc(100vw-32px)] flex-col gap-2.5">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`flex items-center gap-3  border-l-[3px] bg-[#1b1a1f] p-3.5 text-[13.5px] text-[#f2f0ea] shadow-2xl ring-1 ring-white/10 backdrop-blur ${
              t.type === "success"
                ? "border-[#1e7a3c]"
                : t.type === "error"
                  ? "border-[#b3261e]"
                  : "border-[#6c85ad]"
            }`}
          >
            <span
              className={
                t.type === "success"
                  ? "text-[#4fd47a]"
                  : t.type === "error"
                    ? "text-[#f0776f]"
                    : "text-[#8fb0e0]"
              }
            >
              <i className={ICON[t.type] || ICON.info} />
            </span>
            <span className="flex-1">{t.text}</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              aria-label="Dismiss"
              className=" p-0.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <i className="bi bi-x text-base leading-none" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
