import { useEffect, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }) {
  const isMobile = useIsMobile(900);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isMobile) setIsMobileOpen(false);
  }, [isMobile]);

  useEffect(() => {
    function handleOpenSidebar() {
      if (isMobile) {
        setIsMobileOpen(true);
      }
    }

    window.addEventListener("smart-frota:open-sidebar", handleOpenSidebar);
    return () =>
      window.removeEventListener("smart-frota:open-sidebar", handleOpenSidebar);
  }, [isMobile]);

  function openDrawer() {
    if (isMobile) {
      setIsMobileOpen(true);
    }
  }

  function closeDrawer() {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }

  // Desktop: shell always "is-collapsed" so content has 56px margin.
  // Sidebar expands on hover as an overlay. Mobile: drawer behavior.
  const shellIsCollapsed = !isMobile || !isMobileOpen;
  const sidebarIsOpen = isMobile ? isMobileOpen : isHovered;

  return (
    <main className="fg-home-page">
      <div
        className={`fg-home-shell ${shellIsCollapsed ? "is-collapsed" : ""} ${isMobile ? "is-mobile" : ""}`}
      >
        {isMobile && isMobileOpen ? (
          <button
            type="button"
            className="fg-mobile-drawer-overlay"
            aria-label="Fechar menu"
            onClick={closeDrawer}
          />
        ) : null}

        <Sidebar
          isOpen={sidebarIsOpen}
          isMobile={isMobile}
          onClose={closeDrawer}
          onMouseEnter={!isMobile ? () => setIsHovered(true) : undefined}
          onMouseLeave={!isMobile ? () => setIsHovered(false) : undefined}
        />

        <section className="fg-home-main">
          {typeof children === "function"
            ? children({ isMobile, isSidebarOpen: sidebarIsOpen, openDrawer, closeDrawer })
            : children}
        </section>
      </div>
    </main>
  );
}
