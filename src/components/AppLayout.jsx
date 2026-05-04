import { useEffect, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }) {
  const isMobile = useIsMobile(900);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !isMobile);

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    function handleOpenSidebar() {
      if (isMobile) {
        setIsSidebarOpen(true);
      }
    }

    window.addEventListener("smart-frota:open-sidebar", handleOpenSidebar);
    return () =>
      window.removeEventListener(
        "smart-frota:open-sidebar",
        handleOpenSidebar,
      );
  }, [isMobile]);

  function openDrawer() {
    if (isMobile) {
      setIsSidebarOpen(true);
    }
  }

  function closeDrawer() {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }

  return (
    <main className="fg-home-page">
      <div
        className={`fg-home-shell ${isSidebarOpen ? "" : "is-collapsed"} ${isMobile ? "is-mobile" : ""}`}
      >
        {isMobile && isSidebarOpen ? (
          <button
            type="button"
            className="fg-mobile-drawer-overlay"
            aria-label="Fechar menu"
            onClick={closeDrawer}
          />
        ) : null}

        <Sidebar
          isOpen={isSidebarOpen}
          isMobile={isMobile}
          onMouseEnter={
            isMobile ? undefined : () => setIsSidebarOpen(true)
          }
          onMouseLeave={
            isMobile ? undefined : () => setIsSidebarOpen(false)
          }
          onClose={closeDrawer}
        />

        <section className="fg-home-main">
          {typeof children === "function"
            ? children({ isMobile, isSidebarOpen, openDrawer, closeDrawer })
            : children}
        </section>
      </div>
    </main>
  );
}
