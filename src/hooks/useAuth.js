import { useState, useEffect, useCallback } from 'react';

export function useUserRole(baseApi) {
  // Initialize from localStorage cache to prevent flicker/disappear on page load
  const [userRole, setUserRole] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cached_user_role')) || null; } catch { return null; }
  });
  const [permissions, setPermissions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cached_permissions')) || []; } catch { return []; }
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('cached_is_admin') === 'true';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [trigger, setTrigger] = useState(0);
  const [cachedPermissionsVersion, setCachedPermissionsVersion] = useState(null);

  useEffect(() => {
    const handleAuthChange = () => {
      setTrigger(prev => prev + 1);
    };
    window.addEventListener("authChange", handleAuthChange);
    return () => {
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access") || localStorage.getItem("access_token") || localStorage.getItem("token");
    if (!token) {
      setUserRole(null);
      setPermissions([]);
      setIsAdmin(false);
      setIsLoading(false);
      // Clear cache on logout
      localStorage.removeItem('cached_user_role');
      localStorage.removeItem('cached_permissions');
      localStorage.removeItem('cached_is_admin');
      return;
    }

    setIsLoading(true);
    fetch(`${baseApi}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(data => {
        const roleName = (typeof data.role === 'object' ? data.role?.name : String(data.role || '')).toLowerCase();
        const adminFlag = !!data.is_admin || ['admin', 'administrator', 'sub-admin', 'super admin', 'superadmin'].includes(roleName);
        const permsList = data.permissions || [];

        setUserRole(data.role);
        setPermissions(permsList);
        setIsAdmin(adminFlag);

        // Persist to localStorage so next page load doesn't flash
        try {
          localStorage.setItem('cached_user_role', JSON.stringify(data.role));
          localStorage.setItem('cached_permissions', JSON.stringify(permsList));
          localStorage.setItem('cached_is_admin', String(adminFlag));
        } catch (e) { /* ignore storage errors */ }
        
        // Store the permissions version in localStorage to detect changes
        const newVersion = data.permissions_version;
        const storedVersion = localStorage.getItem("permissions_version");
        
        if (storedVersion && storedVersion !== String(newVersion)) {
          console.log("Permissions updated by admin, refreshing...");
          // Dispatch event to notify other components about permissions change
          window.dispatchEvent(new Event("permissionsUpdated"));
        }
        
        localStorage.setItem("permissions_version", String(newVersion));
        setCachedPermissionsVersion(newVersion);
      })
      .catch((err) => {
        if (err.message !== "Unauthorized") {
          console.error("Failed to fetch user role:", err);
        }
        // Keep cached role/permissions on transient errors so sidebar stays visible.
        const tokenStillExists =
          localStorage.getItem("access") ||
          localStorage.getItem("access_token") ||
          localStorage.getItem("token");
        if (!tokenStillExists) {
          setUserRole(null);
          setPermissions([]);
          setIsAdmin(false);
          localStorage.removeItem("cached_user_role");
          localStorage.removeItem("cached_permissions");
          localStorage.removeItem("cached_is_admin");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [baseApi, trigger]);

  // Poll for permission changes every 30 seconds when user is not admin
  useEffect(() => {
    if (isAdmin || isLoading) return;

    const pollInterval = setInterval(() => {
      const token = localStorage.getItem("access") || localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) return;

      fetch(`${baseApi}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error("Unauthorized");
          return res.json();
        })
        .then(data => {
          const newVersion = data.permissions_version;
          const storedVersion = localStorage.getItem("permissions_version");
          
          // If version changed, update permissions
          if (storedVersion && storedVersion !== String(newVersion)) {
            console.log("Permissions changed by admin, updating UI...");
            setPermissions(data.permissions || []);
            localStorage.setItem("permissions_version", String(newVersion));
            setCachedPermissionsVersion(newVersion);
            // Dispatch event to notify other components
            window.dispatchEvent(new Event("permissionsUpdated"));
          }
        })
        .catch(err => {
          // Suppress error logging for 401s (expected when token expires or is invalid)
          if (err.message !== "Unauthorized") {
            console.error("Failed to poll permissions:", err);
          }
        });
    }, 5000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [baseApi, isAdmin, isLoading]);

  const hasPermission = useCallback((docType, action = "read_permission") => {
    if (isAdmin) return true;
    if (!docType) return true;
    if (!permissions || permissions.length === 0) return false;

    const target = permissions.find(
      (p) => p.document_type?.toLowerCase() === docType.toLowerCase()
    );
    if (!target) return false;
    return !!target[action];
  }, [isAdmin, permissions]);

  // Check if user has ANY permission (read, create, write, or delete) for a document type
  // If the main doc type row doesn't exist, falls back to checking sub-parts
  const hasAnyPermission = useCallback((docType) => {
    if (isAdmin) return true;
    if (!docType) return true;
    if (!permissions || permissions.length === 0) return false;

    const key = docType.toLowerCase();

    // Sub-parts fallback map — sidebar uses main doc type but sub-parts may be what's in DB
    const SUBPARTS_MAP = {
      'inventory':   ['Purchase Order (PO)', 'GRN', 'Material Issue', 'Material Return', 'Delivery Challan'],
      'item master': ['High Side', 'Low Side', 'Installation Work'],
      'amc':         ['Service Management'],
    };

    const checkHasAny = (p) => !!(
      p.read_permission ||
      p.create_permission ||
      p.write_permission ||
      p.delete_permission
    );

    // Check main row first
    const target = permissions.find(
      (p) => p.document_type?.toLowerCase() === key
    );

    if (target) {
      // Main row exists — if it has any permission, show. If all OFF, hide.
      return checkHasAny(target);
    }

    // Main row doesn't exist in DB — check sub-parts
    const subParts = SUBPARTS_MAP[key];
    if (subParts) {
      return subParts.some(sub => {
        const subTarget = permissions.find(
          (p) => p.document_type?.toLowerCase() === sub.toLowerCase()
        );
        return subTarget && checkHasAny(subTarget);
      });
    }

    return false;
  }, [isAdmin, permissions]);


  return { userRole, permissions, isAdmin, isLoading, hasPermission, hasAnyPermission };
}