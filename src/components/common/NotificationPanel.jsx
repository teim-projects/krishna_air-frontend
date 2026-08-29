import React, { useEffect, useState, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCheck,
  faTrash,
  faSync,
  faTimes,
  faExclamationTriangle,
  faUserPlus,
  faFileInvoice,
  faBolt,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

const NotificationPanel = ({ onClose, onUnreadCountChange }) => {
  const panelRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        const bellBtn = document.querySelector("[title='Notifications']");
        if (bellBtn && bellBtn.contains(event.target)) {
          return;
        }
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [onClose]);

  const tabs = [
    { id: "ALL", label: "All" },
    { id: "REQUEST", label: "Requests" },
    { id: "FOLLOW_UP", label: "Follow-ups" },
    { id: "LEAD", label: "Leads" },
    { id: "QUOTATION", label: "Quotations" },
  ];

  const fetchNotifications = useCallback(async (tabId = activeTab, isRefresh = false) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}/auth/notifications/?type=${tabId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const dataList = Array.isArray(data) ? data : (data.results || []);
        setNotifications(dataList);

        // Fetch all unread count to update the bell badge count
        const allUnreadResponse = await fetch(
          `${import.meta.env.VITE_BASE_API_URL}/auth/notifications/?type=ALL`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (allUnreadResponse.ok) {
          const allData = await allUnreadResponse.json();
          const allDataList = Array.isArray(allData) ? allData : (allData.results || []);
          const unreadCount = allDataList.filter(n => !n.is_read).length;
          onUnreadCountChange(unreadCount);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, onUnreadCountChange]);

  useEffect(() => {
    fetchNotifications();
  }, [activeTab, fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}/auth/notifications/${id}/mark_read/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        // Optimistically update list
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        // Refresh to sync counts
        fetchNotifications(activeTab);
      }
    } catch (error) {
      console.error("Error marking notification read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}/auth/notifications/mark_all_read/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        fetchNotifications(activeTab);
      }
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}/auth/notifications/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        fetchNotifications(activeTab);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleClearAll = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    if (!window.confirm("Are you sure you want to clear all notifications?")) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}/auth/notifications/clear_all/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        setNotifications([]);
        onUnreadCountChange(0);
      }
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "REQUEST":
        return { icon: faBolt, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" };
      case "FOLLOW_UP":
        return { icon: faExclamationTriangle, color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
      case "LEAD":
        return { icon: faUserPlus, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" };
      case "QUOTATION":
        return { icon: faFileInvoice, color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
      default:
        return { icon: faInfoCircle, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" };
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadNotifications = notifications.filter((n) => !n.is_read);

  return (
    <div ref={panelRef} style={styles.container} className="animate-fadeIn">
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <FontAwesomeIcon icon={faBell} style={{ color: "#3b82f6", fontSize: "1.25rem" }} />
          <span style={styles.headerText}>Notifications</span>
          {unreadNotifications.length > 0 && (
            <span style={styles.badge}>{unreadNotifications.length} New</span>
          )}
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => fetchNotifications(activeTab, true)}
            style={styles.actionIconBtn}
            title="Refresh"
            disabled={refreshing}
          >
            <FontAwesomeIcon
              icon={faSync}
              className={refreshing ? "spin-animation" : ""}
              style={{ color: "#94a3b8" }}
            />
          </button>
          <button onClick={onClose} style={styles.actionIconBtn} title="Close">
            <FontAwesomeIcon icon={faTimes} style={{ color: "#94a3b8" }} />
          </button>
        </div>
      </div>
      <div style={styles.subtitle}>Real-time CRM alerts & updates</div>

      {/* FILTER TABS */}
      <div style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab.id ? styles.activeTab : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ACTION BAR */}
      <div style={styles.actionBar}>
        <span style={styles.countText}>
          Showing {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
        </span>
        {notifications.length > 0 && (
          <div style={styles.actionBarLinks}>
            {unreadNotifications.length > 0 && (
              <button onClick={handleMarkAllRead} style={styles.barActionBtnPrimary}>
                Mark all read
              </button>
            )}
            <button onClick={handleClearAll} style={styles.barActionBtnDanger}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* LIST */}
      <div style={styles.listContainer}>
        {loading ? (
          <div style={styles.loaderContainer}>
            <div className="pulse-loader" style={styles.loader}></div>
            <span style={styles.loadingText}>Fetching updates...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIconContainer}>
              <FontAwesomeIcon icon={faBell} style={styles.emptyIcon} />
            </div>
            <p style={styles.emptyText}>No notifications here</p>
            <p style={styles.emptySubtext}>You are all caught up!</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const { icon, color, bg } = getNotificationIcon(notif.notification_type);
            return (
              <div
                key={notif.id}
                style={{
                  ...styles.notificationCard,
                  ...(notif.is_read ? {} : styles.unreadCard),
                }}
              >
                {!notif.is_read && <div style={styles.unreadDot}></div>}

                {/* Left Colored Icon */}
                <div style={{ ...styles.cardIconContainer, backgroundColor: bg }}>
                  <FontAwesomeIcon icon={icon} style={{ color: color, fontSize: "1.1rem" }} />
                </div>

                {/* Content */}
                <div style={styles.cardContent}>
                  <div style={styles.cardHeader}>
                    {notif.tag && (
                      <span
                        style={{
                          ...styles.cardTag,
                          borderColor: color,
                          color: color,
                        }}
                      >
                        {notif.tag}
                      </span>
                    )}
                    <span style={styles.cardTime}>{formatTime(notif.created_at)}</span>
                  </div>

                  <h4 style={styles.cardTitle}>{notif.title}</h4>
                  <p style={styles.cardDesc}>{notif.description}</p>

                  <div style={styles.cardFooter}>
                    {!notif.is_read ? (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        style={styles.markReadBtn}
                      >
                        <FontAwesomeIcon icon={faCheck} style={{ marginRight: "4px" }} />
                        Mark as read
                      </button>
                    ) : (
                      <span style={styles.readLabel}>
                        <FontAwesomeIcon icon={faCheck} style={{ marginRight: "4px" }} />
                        Read
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      style={styles.deleteBtn}
                      title="Delete"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CUSTOM STYLE INJECTIONS */}
      <style>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .pulse-loader {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #3b82f6;
          animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 0.9; }
          100% { transform: scale(0.6); opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    position: "absolute",
    right: "12px",
    top: "60px",
    width: "410px",
    maxWidth: "calc(100vw - 24px)",
    background: "rgba(30, 41, 59, 0.95)",
    backdropFilter: "blur(16px)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.5)",
    zIndex: 1050,
    fontFamily: "'Inter', sans-serif",
    overflow: "hidden",
    color: "#f8fafc",
    padding: "20px 0 10px 0",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  headerText: {
    fontSize: "1.2rem",
    fontWeight: "700",
    color: "#f8fafc",
    letterSpacing: "-0.025em",
  },
  badge: {
    background: "rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    fontSize: "0.75rem",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "20px",
    textShadow: "0 0 10px rgba(239,68,68,0.5)",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
  },
  actionIconBtn: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "none",
    borderRadius: "8px",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
  },
  subtitle: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    padding: "2px 20px 14px 20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  },
  tabsContainer: {
    display: "flex",
    overflowX: "auto",
    padding: "12px 20px",
    gap: "8px",
    scrollbarWidth: "none",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  },
  tabButton: {
    padding: "6px 12px",
    borderRadius: "20px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(255, 255, 255, 0.05)",
    background: "rgba(255, 255, 255, 0.02)",
    color: "#94a3b8",
    fontSize: "0.8rem",
    fontWeight: "500",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
  },
  activeTab: {
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "#ffffff",
    borderColor: "#3b82f6",
    boxShadow: "0 0 12px rgba(59, 130, 246, 0.35)",
  },
  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px",
    background: "rgba(15, 23, 42, 0.4)",
    fontSize: "0.8rem",
  },
  countText: {
    color: "#94a3b8",
  },
  actionBarLinks: {
    display: "flex",
    gap: "12px",
  },
  barActionBtnPrimary: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    fontWeight: "600",
    cursor: "pointer",
    padding: 0,
    outline: "none",
  },
  barActionBtnDanger: {
    background: "none",
    border: "none",
    color: "#f87171",
    fontWeight: "600",
    cursor: "pointer",
    padding: 0,
    outline: "none",
  },
  listContainer: {
    maxHeight: "380px",
    overflowY: "auto",
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 0",
    gap: "12px",
  },
  loadingText: {
    fontSize: "0.85rem",
    color: "#94a3b8",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "50px 20px",
    textAlign: "center",
  },
  emptyIconContainer: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.03)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  emptyIcon: {
    fontSize: "1.8rem",
    color: "#475569",
  },
  emptyText: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#cbd5e1",
    margin: 0,
  },
  emptySubtext: {
    fontSize: "0.8rem",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  notificationCard: {
    position: "relative",
    display: "flex",
    gap: "12px",
    padding: "12px",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    transition: "all 0.2s ease",
  },
  unreadCard: {
    background: "rgba(59, 130, 246, 0.04)",
    borderColor: "rgba(59, 130, 246, 0.15)",
  },
  unreadDot: {
    position: "absolute",
    top: "14px",
    right: "14px",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#3b82f6",
    boxShadow: "0 0 8px #3b82f6",
  },
  cardIconContainer: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardContent: {
    flexGrow: 1,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "4px",
    paddingRight: "16px",
  },
  cardTag: {
    fontSize: "0.65rem",
    fontWeight: "700",
    borderWidth: "1px",
    borderStyle: "solid",
    padding: "1px 6px",
    borderRadius: "4px",
  },
  cardTime: {
    fontSize: "0.7rem",
    color: "#64748b",
  },
  cardTitle: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#f1f5f9",
    margin: "0 0 4px 0",
    lineHeight: "1.25",
  },
  cardDesc: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    margin: "0 0 10px 0",
    lineHeight: "1.4",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid rgba(255, 255, 255, 0.03)",
    paddingTop: "8px",
  },
  markReadBtn: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    fontSize: "0.75rem",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 0,
    outline: "none",
  },
  readLabel: {
    color: "#10b981",
    fontSize: "0.75rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    transition: "color 0.2s ease",
    padding: "2px",
    outline: "none",
    ":hover": {
      color: "#ef4444",
    },
  },
};

export default NotificationPanel;
