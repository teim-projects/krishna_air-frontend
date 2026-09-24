import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser, faBars, faBell } from "@fortawesome/free-solid-svg-icons";
import NotificationPanel from "./common/NotificationPanel";

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem("access");
    if (!token) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}/auth/notifications/?type=ALL`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const unread = data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  const handleLogout = useCallback(() => {
    window.dispatchEvent(new Event("authChange"));
    setIsAuthenticated(false);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("cached_user_role");
    localStorage.removeItem("cached_permissions");
    localStorage.removeItem("cached_is_admin");
    localStorage.removeItem("permissions_version");
    navigate("/login", { replace: true });
  }, [navigate]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    // Show authenticated UI immediately when a token exists (avoids sidebar/login flicker).
    setIsAuthenticated(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}/auth/dj-rest-auth/user/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch {
      // Network hiccup (e.g. ERR_EMPTY_RESPONSE) — keep session; do not clear token.
    }
  }, [handleLogout]);

  useEffect(() => {
    const onAuthChange = () => {
      const token = localStorage.getItem("access");
      setIsAuthenticated(!!token);
      if (token) checkAuth();
    };
    window.addEventListener("authChange", onAuthChange);
    return () => window.removeEventListener("authChange", onAuthChange);
  }, [checkAuth]);

  useEffect(() => {
    const publicPaths = ["/login", "/register"];
    if (!publicPaths.includes(location.pathname)) {
      checkAuth();
    } else {
      setIsAuthenticated(false);
    }
  }, [location, checkAuth]);

  return (
    <nav style={styles.navbar}>
      {/* LEFT: Menu Icon & Branding */}
      <div style={styles.left}>
        <button
          onClick={onMenuClick}
          className="hover:scale-105 hover:bg-blue-700 active:scale-95 transition-all duration-200"
          style={styles.menuBtn}
          title="Toggle Sidebar"
        >
          <FontAwesomeIcon icon={faBars} style={styles.menuIcon} />
        </button>

        <Link
          to="/dashboard"
          className="hover:text-blue-100 transition-colors duration-200"
          style={styles.logo}
        >
          KRISNA CRM
        </Link>
      </div>
      {/* RIGHT: Profile / Login */}
      <div style={styles.links}>
        {isAuthenticated && (
          <div style={styles.bellContainer}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={styles.bellBtn}
              title="Notifications"
            >
              <FontAwesomeIcon icon={faBell} size="lg" />
              {unreadCount > 0 && <span style={styles.bellBadge}>{unreadCount}</span>}
            </button>
            {showNotifications && (
              <NotificationPanel
                onClose={() => setShowNotifications(false)}
                onUnreadCountChange={setUnreadCount}
              />
            )}
          </div>
        )}
        {isAuthenticated ? (
          <Link to="/profile" style={styles.profileLink}>
            <FontAwesomeIcon icon={faCircleUser} size="lg" title="Profile" />
          </Link>
        ) : (
          <Link to="/login" style={styles.link}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    backgroundColor: "#34495E",
    color: "white",
    position: "fixed",
    top: "0",
    width: "100%",
    zIndex: 1000,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  menuBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    backgroundColor: "#2563EB",
    border: "none",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(37, 99, 235, 0.25)",
    outline: "none",
  },
  menuIcon: {
    fontSize: "1.1rem",
  },
  logo: {
    color: "white",
    fontSize: "1.3rem",
    fontWeight: "800",
    textDecoration: "none",
    letterSpacing: "0.5px",
    fontFamily: "'Inter', sans-serif",
    display: "block",
  },
  links: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "bold",
    padding: "8px 14px",
    borderRadius: "6px",
    backgroundColor: "#388E3C",
  },
  bellContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  bellBtn: {
    background: "none",
    border: "none",
    color: "white",
    cursor: "pointer",
    position: "relative",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "none",
  },
  bellBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    backgroundColor: "#ef4444",
    color: "white",
    fontSize: "0.65rem",
    fontWeight: "bold",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 6px rgba(239, 68, 68, 0.6)",
  },
  profileLink: {
    color: "white",
    display: "flex",
    alignItems: "center",
  },
};

export default Navbar;
