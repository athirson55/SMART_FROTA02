import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const UiFeedbackContext = createContext(null);

export function UiFeedbackProvider({ children }) {
  const [loadingText, setLoadingText] = useState("");
  const [toast, setToast] = useState({ type: "success", message: "" });
  const toastTimerRef = useRef(null);

  const showLoading = useCallback((message = "Carregando...") => {
    setLoadingText(message);
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingText("");
  }, []);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast({ type: "success", message: "" });
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const value = useMemo(
    () => ({
      showLoading,
      hideLoading,
      showSuccess: (message) => showToast("success", message),
      showError: (message) => showToast("error", message),
      showInfo: (message) => showToast("info", message),
    }),
    [hideLoading, showLoading, showToast],
  );

  return (
    <UiFeedbackContext.Provider value={value}>
      {children}

      {loadingText ? (
        <div className="fg-ui-loading-overlay" role="status" aria-live="polite">
          <div className="fg-ui-loading-box">{loadingText}</div>
        </div>
      ) : null}

      {toast.message ? (
        <div
          className={`fg-ui-toast is-${toast.type}`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      ) : null}
    </UiFeedbackContext.Provider>
  );
}

export function useUiFeedback() {
  const context = useContext(UiFeedbackContext);

  if (!context) {
    throw new Error("useUiFeedback deve ser usado dentro de UiFeedbackProvider");
  }

  return context;
}
