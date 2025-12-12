import { useState, useEffect } from 'react';

export function useUserRole(baseApi) {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`${baseApi}/api/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUserRole(data.role);
      })
      .catch(err => {
        console.error("Failed to fetch user role:", err);
        setUserRole(null); // Set to null on error
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [baseApi]); // Re-run if baseApi changes

  return { userRole, isLoading };
}