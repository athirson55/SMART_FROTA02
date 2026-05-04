export function AppIcon({ type }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: "1.8" };

  if (type === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 11.5 12 5l8 6.5" {...common} />
        <path d="M6.5 10.5V19h11v-8.5" {...common} />
      </svg>
    );
  }
  if (type === "grid") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="6" height="6" rx="1" {...common} />
        <rect x="14" y="4" width="6" height="6" rx="1" {...common} />
        <rect x="4" y="14" width="6" height="6" rx="1" {...common} />
        <rect x="14" y="14" width="6" height="6" rx="1" {...common} />
      </svg>
    );
  }
  if (type === "truck") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 7h12v8H2z" {...common} />
        <path d="M14 10h4l3 3v2h-7z" {...common} />
        <circle cx="7" cy="17" r="2" {...common} />
        <circle cx="17" cy="17" r="2" {...common} />
      </svg>
    );
  }
  if (type === "users") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3" {...common} />
        <path d="M4 18c.9-2.4 2.9-3.5 5-3.5s4.1 1.1 5 3.5" {...common} />
        <circle cx="17" cy="9" r="2.2" {...common} />
        <path
          d="M14.5 17.6c.6-1.5 1.7-2.3 3.2-2.3 1.4 0 2.5.8 3 2.3"
          {...common}
        />
      </svg>
    );
  }
  if (type === "wrench") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M21 7a5 5 0 0 1-6 4.9l-7.8 7.8a2 2 0 1 1-2.8-2.8l7.8-7.8A5 5 0 0 1 17 3l-3 3 4 4z"
          {...common}
        />
      </svg>
    );
  }
  if (type === "calendar") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" {...common} />
        <path d="M3 10h18M8 3v4M16 3v4" {...common} />
      </svg>
    );
  }
  if (type === "bell") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 16H6l1.5-2v-3a4.5 4.5 0 1 1 9 0v3z" {...common} />
        <path d="M10 18a2 2 0 0 0 4 0" {...common} />
      </svg>
    );
  }
  if (type === "chart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20V6M10 20v-8M16 20v-5M22 20H2" {...common} />
      </svg>
    );
  }
  if (type === "settings") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3" {...common} />
        <path
          d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"
          {...common}
        />
      </svg>
    );
  }
  if (type === "pin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 21s6-6.2 6-10a6 6 0 1 0-12 0c0 3.8 6 10 6 10z"
          {...common}
        />
        <circle cx="12" cy="11" r="2" {...common} />
      </svg>
    );
  }
  if (type === "clock") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" {...common} />
        <path d="M12 8v5l3 2" {...common} />
      </svg>
    );
  }
  if (type === "doc") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h7l4 4v14H7z" {...common} />
        <path d="M14 3v5h4M10 12h5M10 16h5" {...common} />
      </svg>
    );
  }
  if (type === "plus") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" {...common} />
      </svg>
    );
  }
  if (type === "logout") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" {...common} />
        <path d="M14 7l4 5-4 5" {...common} />
        <path d="M18 12H9" {...common} />
      </svg>
    );
  }
  if (type === "trash") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z" {...common} />
        <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" {...common} />
      </svg>
    );
  }
  if (type === "menu") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" {...common} />
      </svg>
    );
  }

  return null;
}
