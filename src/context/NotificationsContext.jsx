import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  deleteNotification,
  generateNotifications,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  updateNotification,
} from "../services/notifications";

const NotificationsContext = createContext(null);

const POLL_INTERVAL_MS = 60_000; // re-fetch every 60 s
const PREVIEW_LIMIT = 6;         // items shown in header dropdown

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const fetchPreview = useCallback(async () => {
    if (!user) return;
    try {
      const [countRes, listRes] = await Promise.all([
        getUnreadCount(),
        getNotifications({ limit: PREVIEW_LIMIT, isRead: false }),
      ]);
      setUnreadCount(countRes.data?.data?.count ?? 0);
      setNotifications(listRes.data?.data ?? []);
    } catch {
      // silent — network errors should not break the UI
    }
  }, [user]);

  // Initial load + generate on first mount per user session
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let active = true;

    (async () => {
      setLoading(true);
      try {
        // Auto-generate preventive notifications in the background
        await generateNotifications().catch(() => {});
        if (!active) return;
        await fetchPreview();
      } finally {
        if (active) setLoading(false);
      }
    })();

    // Polling
    timerRef.current = setInterval(fetchPreview, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(timerRef.current);
    };
  }, [user, fetchPreview]);

  const markAsRead = useCallback(async (id) => {
    try {
      await updateNotification(id, { isRead: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  }, []);

  const dismiss = useCallback(async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  }, []);

  const refresh = useCallback(() => fetchPreview(), [fetchPreview]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, markAsRead, markAllRead, dismiss, refresh }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}
