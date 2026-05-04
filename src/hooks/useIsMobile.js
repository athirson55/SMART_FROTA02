import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);

  useEffect(() => {
    function syncViewport() {
      setIsMobile(window.innerWidth <= breakpoint);
    }

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, [breakpoint]);

  return isMobile;
}
