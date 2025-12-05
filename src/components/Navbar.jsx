import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser } from "@fortawesome/free-solid-svg-icons";
import { width } from "@fortawesome/free-solid-svg-icons/fa0";


const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ Logout function
  const handleLogout = useCallback(() => {
    
    window.dispatchEvent(new Event("authChange"));
    setIsAuthenticated(false);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login", { replace: true }); // redirect to login
  }, [navigate]);

  // ✅ Auth check (validates token)
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("access");

    if (!token) {
     
      setIsAuthenticated(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/api/auth/dj-rest-auth/user/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setIsAuthenticated(true); // token valid ✅
      } else {
        console.warn("❌ Token invalid or expired.");
        handleLogout(); // token invalid → logout
      }
    } catch (err) {
      console.error("⚠️ Error verifying token:", err);
      handleLogout();
    }
  }, [handleLogout]);

  useEffect(() => {
    const publicPaths = ["/login", "/register"];
    const isPublicPage = publicPaths.includes(location.pathname);

    // ✅ Check token only for protected pages
    if (!isPublicPage) {
      checkAuth();
    } else {
      setIsAuthenticated(false); // public page → hide logout button
    }

    const handleAuthChange = () => checkAuth();
    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, [location, checkAuth]);

  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}><Link to="/dashboard" >Krisna AC</Link></div>
      <div style={styles.links}>
        {isAuthenticated ? (
          <>
            <Link to="/profile" style={styles.iconLink}>
              <FontAwesomeIcon icon={faCircleUser} size="lg" title="Profile" />
            </Link>

          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            {/* <Link to="/register" style={styles.link}>Register</Link> */}
          </>
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
    top:"0%",
    width:"100%",
    
    zIndex: 1000,
  },
  logo: { fontSize: "1.5em", fontWeight: "bold" },
  links: { display: "flex", gap: "12px" },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "bold",
    padding: "8px 14px",
    borderRadius: "6px",
    backgroundColor: "#388E3C",
  },
  logoutBtn: {
    backgroundColor: "white",
    color: "#4CAF50",
    border: "none",
    borderRadius: "6px",
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default Navbar;
